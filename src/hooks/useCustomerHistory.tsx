import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CustomerGeneration {
  id: string;
  image_name: string;
  title: string;
  description: string;
  tags: string;
  created_at: string;
  image_url: string;
}

interface CustomerPayment {
  id: string;
  plan_name: string;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

interface CustomerHistoryData {
  generations: CustomerGeneration[];
  payments: CustomerPayment[];
  totalGenerations: number;
  totalPayments: number;
  totalSpent: number;
  approvedPayments: number;
}

export function useCustomerHistory(userId: string | null) {
  return useQuery({
    queryKey: ['customer-history', userId],
    queryFn: async (): Promise<CustomerHistoryData> => {
      if (!userId) throw new Error('No user ID provided');

      // Fetch generations
      const { data: generations, error: genError } = await supabase
        .from('generations')
        .select('id, image_name, title, description, tags, created_at, image_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (genError) throw genError;

      // Fetch payments
      const { data: payments, error: payError } = await supabase
        .from('payment_requests')
        .select('id, plan_name, amount, payment_method, transaction_id, status, created_at, admin_notes')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (payError) throw payError;

      const approvedPayments = payments?.filter(p => p.status === 'approved') || [];
      const totalSpent = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        generations: generations || [],
        payments: payments || [],
        totalGenerations: generations?.length || 0,
        totalPayments: payments?.length || 0,
        totalSpent,
        approvedPayments: approvedPayments.length,
      };
    },
    enabled: !!userId,
  });
}
