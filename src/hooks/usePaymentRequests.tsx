import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface PaymentRequest {
  id: string;
  user_id: string;
  plan_name: string;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  screenshot_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_phone?: string;
  user_name?: string;
}

interface UserInfo {
  user_id: string;
  email: string;
  phone_number: string | null;
  full_name: string | null;
  credits: number;
  created_at: string | null;
}

export function usePaymentRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payment-requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaymentRequest[];
    },
    enabled: !!user,
  });
}

export function useAdminPaymentRequests() {
  return useQuery({
    queryKey: ['admin-payment-requests'],
    queryFn: async () => {
      // Get payment requests
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Get user info from admin_user_view
      const { data: users, error: usersError } = await supabase
        .from('admin_user_view')
        .select('user_id, email, phone_number, full_name');

      if (usersError) {
        console.error('Error fetching user info:', usersError);
        return payments as PaymentRequest[];
      }

      // Merge user info with payments
      const paymentsWithUserInfo = payments?.map(payment => {
        const userInfo = users?.find(u => u.user_id === payment.user_id);
        return {
          ...payment,
          user_email: userInfo?.email || null,
          user_phone: userInfo?.phone_number || null,
          user_name: userInfo?.full_name || null,
        };
      });

      return paymentsWithUserInfo as PaymentRequest[];
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_user_view')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserInfo[];
    },
  });
}

export function useApprovePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      paymentId, 
      userId, 
      credits, 
      adminNotes,
      userEmail,
      userName,
      planName,
    }: { 
      paymentId: string; 
      userId: string; 
      credits: number; 
      adminNotes?: string;
      userEmail?: string;
      userName?: string;
      planName?: string;
    }) => {
      // Update payment status
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({ 
          status: 'approved', 
          admin_notes: adminNotes || `${credits} credits added` 
        })
        .eq('id', paymentId);

      if (updateError) throw updateError;

      // Add credits to user
      const { error: creditsError } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_credits: credits,
      });

      if (creditsError) throw creditsError;

      // Send email notification
      if (userEmail) {
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: userEmail,
              type: 'payment_approved',
              customerName: userName || 'Valued Customer',
              planName: planName || 'Premium',
              credits: credits,
            }
          });
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          // Don't throw - payment was successful, email is just notification
        }
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
      toast.success('Payment approved, credits added & email sent!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve payment');
    },
  });
}

export function useRejectPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      paymentId, 
      adminNotes,
      userEmail,
      userName,
      planName,
    }: { 
      paymentId: string; 
      adminNotes?: string;
      userEmail?: string;
      userName?: string;
      planName?: string;
    }) => {
      const { error } = await supabase
        .from('payment_requests')
        .update({ 
          status: 'rejected', 
          admin_notes: adminNotes || 'Payment rejected' 
        })
        .eq('id', paymentId);

      if (error) throw error;

      // Send email notification
      if (userEmail) {
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: userEmail,
              type: 'payment_rejected',
              customerName: userName || 'Valued Customer',
              planName: planName || 'Premium',
            }
          });
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
        }
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
      toast.success('Payment rejected & email sent');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject payment');
    },
  });
}

export function useSendCustomEmail() {
  return useMutation({
    mutationFn: async ({ 
      to,
      subject,
      html,
    }: { 
      to: string;
      subject: string;
      html: string;
    }) => {
      const { error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, html }
      });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success('Email sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send email');
    },
  });
}

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
      toast.success('User deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
}
