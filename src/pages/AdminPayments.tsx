import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { useAdminPaymentRequests, useAdminUsers, useApprovePayment, useRejectPayment, useIsAdmin, useSendCustomEmail } from '@/hooks/usePaymentRequests';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ShieldCheck, Clock, CheckCircle, XCircle, Loader2, Mail, Phone, User, Send, Users } from 'lucide-react';

const CREDITS_BY_PLAN: Record<string, number> = {
  'Lite': 100,
  'Pro': 500,
  'Unlimited': 999999,
};

export default function AdminPayments() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: payments, isLoading } = useAdminPaymentRequests();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const approveMutation = useApprovePayment();
  const rejectMutation = useRejectPayment();
  const sendEmailMutation = useSendCustomEmail();

  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [credits, setCredits] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  
  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  if (authLoading || isAdminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Access Denied</h3>
              <p className="text-muted-foreground">
                You don't have permission to access this page.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
  const approvedPayments = payments?.filter(p => p.status === 'approved') || [];
  const rejectedPayments = payments?.filter(p => p.status === 'rejected') || [];

  const openActionDialog = (payment: any, type: 'approve' | 'reject') => {
    setSelectedPayment(payment);
    setActionType(type);
    setCredits(type === 'approve' ? String(CREDITS_BY_PLAN[payment.plan_name] || 100) : '');
    setAdminNotes('');
  };

  const handleAction = async () => {
    if (!selectedPayment) return;

    if (actionType === 'approve') {
      await approveMutation.mutateAsync({
        paymentId: selectedPayment.id,
        userId: selectedPayment.user_id,
        credits: parseInt(credits) || 0,
        adminNotes,
        userEmail: selectedPayment.user_email,
        userName: selectedPayment.user_name,
        planName: selectedPayment.plan_name,
      });
    } else {
      await rejectMutation.mutateAsync({
        paymentId: selectedPayment.id,
        adminNotes,
        userEmail: selectedPayment.user_email,
        userName: selectedPayment.user_name,
        planName: selectedPayment.plan_name,
      });
    }

    setSelectedPayment(null);
    setActionType(null);
  };

  const openEmailDialog = (email: string) => {
    setEmailTo(email);
    setEmailSubject('');
    setEmailBody('');
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailTo || !emailSubject || !emailBody) {
      return;
    }

    await sendEmailMutation.mutateAsync({
      to: emailTo,
      subject: emailSubject,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>${emailBody.replace(/\n/g, '<br>')}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">Best regards,<br>The PromptNest Team</p>
      </div>`,
    });

    setEmailDialogOpen(false);
  };

  const PaymentCard = ({ payment, showActions = false }: { payment: any; showActions?: boolean }) => (
    <Card key={payment.id}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{payment.plan_name}</CardTitle>
            <CardDescription>
              {format(new Date(payment.created_at), 'dd MMM yyyy, hh:mm a')}
            </CardDescription>
          </div>
          <Badge 
            variant={
              payment.status === 'approved' ? 'default' : 
              payment.status === 'rejected' ? 'destructive' : 'secondary'
            }
          >
            {payment.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
            {payment.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
            {payment.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
            {payment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Customer Info */}
        <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
            <User className="h-4 w-4" />
            Customer Info
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{payment.user_email || 'N/A'}</span>
              {payment.user_email && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => openEmailDialog(payment.user_email)}
                >
                  <Send className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{payment.user_phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{payment.user_name || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
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
          <div>
            <span className="text-muted-foreground">User ID</span>
            <p className="font-medium font-mono text-xs truncate">{payment.user_id}</p>
          </div>
        </div>

        {payment.admin_notes && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Admin Notes:</span>
            <p className="text-sm font-medium">{payment.admin_notes}</p>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              onClick={() => openActionDialog(payment, 'approve')}
              className="bg-success hover:bg-success/90"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => openActionDialog(payment, 'reject')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage payments & customers</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="mb-6">
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingPayments.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {pendingPayments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="customers">
                <Users className="h-4 w-4 mr-1" />
                Customers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingPayments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No pending requests</h3>
                  </CardContent>
                </Card>
              ) : (
                pendingPayments.map(payment => (
                  <PaymentCard key={payment.id} payment={payment} showActions />
                ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {approvedPayments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No approved payments</h3>
                  </CardContent>
                </Card>
              ) : (
                approvedPayments.map(payment => (
                  <PaymentCard key={payment.id} payment={payment} />
                ))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejectedPayments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No rejected payments</h3>
                  </CardContent>
                </Card>
              ) : (
                rejectedPayments.map(payment => (
                  <PaymentCard key={payment.id} payment={payment} />
                ))
              )}
            </TabsContent>

            <TabsContent value="customers" className="space-y-4">
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : !users || users.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No customers yet</h3>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {users.map((u: any) => (
                    <Card key={u.user_id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{u.full_name || 'No name'}</p>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Credits</p>
                              <p className="font-bold text-lg">{u.credits}</p>
                            </div>
                            <div className="flex gap-2">
                              {u.phone_number && (
                                <a href={`tel:${u.phone_number}`}>
                                  <Button variant="outline" size="icon">
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </a>
                              )}
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => openEmailDialog(u.email)}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Action Dialog */}
        <Dialog open={!!selectedPayment && !!actionType} onOpenChange={() => { setSelectedPayment(null); setActionType(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Approve Payment' : 'Reject Payment'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve' 
                  ? 'Enter the number of credits to add. An email will be sent to the customer.'
                  : 'Are you sure you want to reject this payment? An email will be sent to notify the customer.'
                }
              </DialogDescription>
            </DialogHeader>

            {selectedPayment?.user_email && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                <Mail className="h-4 w-4" />
                <span>Email will be sent to: <strong>{selectedPayment.user_email}</strong></span>
              </div>
            )}

            <div className="space-y-4 py-4">
              {actionType === 'approve' && (
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits to Add</Label>
                  <Input
                    id="credits"
                    type="number"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    placeholder="100"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes (optional)</Label>
                <Input
                  id="notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={actionType === 'approve' ? 'Payment verified' : 'Reason for rejection'}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setSelectedPayment(null); setActionType(null); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAction}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                variant={actionType === 'approve' ? 'default' : 'destructive'}
              >
                {(approveMutation.isPending || rejectMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {actionType === 'approve' ? 'Approve & Send Email' : 'Reject & Notify'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Send Email
              </DialogTitle>
              <DialogDescription>
                Send a custom message to the customer.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email-to">To</Label>
                <Input
                  id="email-to"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="customer@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter subject..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-body">Message</Label>
                <Textarea
                  id="email-body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Enter your message..."
                  rows={6}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendEmail}
                disabled={sendEmailMutation.isPending || !emailTo || !emailSubject || !emailBody}
              >
                {sendEmailMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
