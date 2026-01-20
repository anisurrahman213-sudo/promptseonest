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
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PaymentRequest[];
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
      adminNotes 
    }: { 
      paymentId: string; 
      userId: string; 
      credits: number; 
      adminNotes?: string;
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

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
      toast.success('Payment approved and credits added!');
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
      adminNotes 
    }: { 
      paymentId: string; 
      adminNotes?: string;
    }) => {
      const { error } = await supabase
        .from('payment_requests')
        .update({ 
          status: 'rejected', 
          admin_notes: adminNotes || 'Payment rejected' 
        })
        .eq('id', paymentId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
      toast.success('Payment rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject payment');
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
