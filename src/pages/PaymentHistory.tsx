import { Header } from '@/components/layout/Header';
import { usePaymentRequests } from '@/hooks/usePaymentRequests';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Receipt, Clock, CheckCircle, XCircle } from 'lucide-react';

const statusConfig = {
  pending: {
    label: 'Pending',
    variant: 'secondary' as const,
    icon: Clock,
    color: 'text-yellow-500',
  },
  approved: {
    label: 'Approved',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'text-success',
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'text-destructive',
  },
};

export default function PaymentHistory() {
  const { user, loading: authLoading } = useAuth();
  const { data: payments, isLoading } = usePaymentRequests();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <Receipt className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-bold">Payment History</h1>
            <p className="text-muted-foreground">All your payment requests</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : !payments || payments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No payments yet</h3>
              <p className="text-muted-foreground">
                You haven't made any payments yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => {
              const status = statusConfig[payment.status];
              const StatusIcon = status.icon;
              
              return (
                <Card key={payment.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{payment.plan_name}</CardTitle>
                        <CardDescription>
                          {format(new Date(payment.created_at), 'dd MMM yyyy, hh:mm a')}
                        </CardDescription>
                      </div>
                      <Badge variant={status.variant} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Amount</span>
                        <p className="font-medium">${payment.amount}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Method</span>
                        <p className="font-medium capitalize">{payment.payment_method}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transaction ID</span>
                        <p className="font-medium font-mono text-xs">{payment.transaction_id || '-'}</p>
                      </div>
                      {payment.admin_notes && (
                        <div className="col-span-2 md:col-span-4">
                          <span className="text-muted-foreground">Note</span>
                          <p className="font-medium">{payment.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
