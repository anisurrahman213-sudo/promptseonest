import { useState, useEffect, useMemo } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers, useIsAdmin, useDeleteUser, useSendCustomEmail, useAdminPaymentRequests } from '@/hooks/usePaymentRequests';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, CreditCard, ArrowLeft, ImageIcon, Wallpaper, Trash2, Video, Play, AlertCircle, CheckCircle, DollarSign, Activity, MessageSquare } from 'lucide-react';
import { SupportTicketsManagement } from '@/components/admin/SupportTicketsManagement';
import { FeatureCardManagement } from '@/components/admin/FeatureCardManagement';
import { HeroBackgroundManagement } from '@/components/admin/HeroBackgroundManagement';
import { DemoVideoManagement } from '@/components/admin/DemoVideoManagement';
import { GenerationsManagement } from '@/components/admin/GenerationsManagement';
import { CustomerHistoryDialog } from '@/components/admin/CustomerHistoryDialog';
import { UserFilters, filterUsers } from '@/components/admin/UserFilters';
import { BulkEmailDialog } from '@/components/admin/BulkEmailDialog';
import { TutorialManagement } from '@/components/admin/TutorialManagement';
import { useAdminInactivityLogout } from '@/hooks/useAdminInactivityLogout';
import { CreditSettings } from '@/components/admin/CreditSettings';
import { AdminUserList } from '@/components/admin/AdminUserList';
import { AddCreditsDialog, EmailDialog, DeleteUserDialog } from '@/components/admin/AdminDialogs';
import { HealthCheckPanel } from '@/pages/HealthCheck';

export default function AdminDashboard() {
  useAdminInactivityLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: paymentRequests } = useAdminPaymentRequests();
  const deleteUserMutation = useDeleteUser();
  const sendEmailMutation = useSendCustomEmail();
  const queryClient = useQueryClient();

  const pendingPayments = useMemo(() => paymentRequests?.filter(p => p.status === 'pending') || [], [paymentRequests]);
  const approvedThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return paymentRequests?.filter(p => p.status === 'approved' && new Date(p.updated_at) >= startOfMonth) || [];
  }, [paymentRequests]);
  const monthlyRevenue = useMemo(() => approvedThisMonth.reduce((sum, p) => sum + Number(p.amount), 0), [approvedThisMonth]);

  const [addCreditsDialog, setAddCreditsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ userId: string; email: string } | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ userId: string; email: string } | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [userFilters, setUserFilters] = useState<UserFilters>({ search: '', minCredits: null, maxCredits: null, startDate: null, endDate: null });
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkEmailDialogOpen, setBulkEmailDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(location.pathname === '/admin/health' ? 'health' : 'users');

  const filteredUsersForEmail = useMemo(() => {
    if (!users) return [];
    return users.filter(u => selectedUserIds.has(u.user_id)).map(u => ({ email: u.email, full_name: u.full_name }));
  }, [users, selectedUserIds]);

  useEffect(() => {
    if (!authLoading && !adminLoading && (!user || !isAdmin)) navigate('/');
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    setActiveTab(location.pathname === '/admin/health' ? 'health' : 'users');
  }, [location.pathname]);

  const addCreditsMutation = useMutation({
    mutationFn: async ({ userId, credits }: { userId: string; credits: number }) => {
      const { error } = await supabase.rpc('add_credits', { p_user_id: userId, p_credits: credits });
      if (error) throw error;
      return true;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); toast.success(`${creditsToAdd} credits added successfully!`); setAddCreditsDialog(false); setCreditsToAdd(''); setSelectedUser(null); },
    onError: (error: any) => { toast.error(error.message || 'Failed to add credits'); },
  });

  const handleAddCredits = () => {
    if (!selectedUser || !creditsToAdd) return;
    const credits = parseInt(creditsToAdd);
    if (isNaN(credits) || credits <= 0) { toast.error('Please enter a valid number of credits'); return; }
    addCreditsMutation.mutate({ userId: selectedUser.userId, credits });
  };

  const handleSendEmail = async () => {
    if (!emailTo || !emailSubject || !emailBody) return;
    await sendEmailMutation.mutateAsync({
      to: emailTo, subject: emailSubject,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>${emailBody.replace(/\n/g, '<br>')}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">Best regards,<br>The PromptNest Team</p>
      </div>`,
    });
    setEmailDialogOpen(false);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => { const next = new Set(prev); if (next.has(userId)) next.delete(userId); else next.add(userId); return next; });
  };

  const toggleSelectAll = () => {
    if (!users) return;
    const filtered = filterUsers(users, userFilters);
    setSelectedUserIds(selectedUserIds.size === filtered.length ? new Set() : new Set(filtered.map((u: any) => u.user_id)));
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'health') {
      navigate('/admin/health');
    } else if (location.pathname === '/admin/health') {
      navigate('/admin-dashboard', { replace: true });
    }
  };

  if (authLoading || adminLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user || !isAdmin) return null;

  const totalUsers = users?.length || 0;
  const totalCredits = users?.reduce((sum, u) => sum + (u.credits || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Admin Dashboard" description="Admin dashboard for managing users and settings." path="/admin-dashboard" noindex />
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users & credits</p>
          </div>
          <Button variant="default" size="sm" onClick={() => handleTabChange('health')} className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-md">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Health Check</span>
            <span className="sm:hidden">Health</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full max-w-6xl grid-cols-9">
            <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /><span className="hidden sm:inline">Users</span></TabsTrigger>
            <TabsTrigger value="credits" className="gap-2"><CreditCard className="h-4 w-4" /><span className="hidden sm:inline">Credits</span></TabsTrigger>
            <TabsTrigger value="generations" className="gap-2"><Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Generations</span></TabsTrigger>
            <TabsTrigger value="support" className="gap-2"><MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">Support</span></TabsTrigger>
            <TabsTrigger value="tutorials" className="gap-2"><Video className="h-4 w-4" /><span className="hidden sm:inline">Tutorials</span></TabsTrigger>
            <TabsTrigger value="demo" className="gap-2"><Play className="h-4 w-4" /><span className="hidden sm:inline">Demo</span></TabsTrigger>
            <TabsTrigger value="hero" className="gap-2"><Wallpaper className="h-4 w-4" /><span className="hidden sm:inline">Hero BG</span></TabsTrigger>
            <TabsTrigger value="features" className="gap-2"><ImageIcon className="h-4 w-4" /><span className="hidden sm:inline">Features</span></TabsTrigger>
            <TabsTrigger value="health" className="gap-2 text-primary data-[state=active]:text-primary"><Activity className="h-4 w-4" /><span className="hidden sm:inline">Health</span></TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{totalUsers}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{totalCredits.toLocaleString()}</div></CardContent>
              </Card>
              <Card className={pendingPayments.length > 0 ? 'border-destructive/30 bg-destructive/5' : ''}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                  <AlertCircle className={`h-4 w-4 ${pendingPayments.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingPayments.length}</div>
                  {pendingPayments.length > 0 && (
                    <Button size="sm" variant="outline" className="mt-2 w-full gap-1.5" onClick={() => navigate('/admin/payments')}>
                      Review Payments
                    </Button>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">৳{monthlyRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">{approvedThisMonth.length} approved this month</p>
                </CardContent>
              </Card>
            </div>

            <AdminUserList
              users={users} usersLoading={usersLoading}
              userFilters={userFilters} setUserFilters={setUserFilters}
              selectedUserIds={selectedUserIds}
              onToggleUser={toggleUserSelection} onToggleSelectAll={toggleSelectAll}
              onOpenHistory={(u) => { setSelectedCustomer(u); setHistoryDialogOpen(true); }}
              onOpenAddCredits={(userId, email) => { setSelectedUser({ userId, email }); setCreditsToAdd(''); setAddCreditsDialog(true); }}
              onOpenEmail={(email) => { setEmailTo(email); setEmailSubject(''); setEmailBody(''); setEmailDialogOpen(true); }}
              onOpenDelete={(userId, email) => { setUserToDelete({ userId, email }); setDeleteDialogOpen(true); }}
              onOpenBulkEmail={() => setBulkEmailDialogOpen(true)}
            />
          </TabsContent>

          <TabsContent value="generations"><GenerationsManagement /></TabsContent>
          <TabsContent value="support"><SupportTicketsManagement /></TabsContent>
          <TabsContent value="credits"><CreditSettings /></TabsContent>
          <TabsContent value="tutorials"><TutorialManagement /></TabsContent>
          <TabsContent value="demo"><DemoVideoManagement /></TabsContent>
          <TabsContent value="hero"><HeroBackgroundManagement /></TabsContent>
          <TabsContent value="features"><FeatureCardManagement /></TabsContent>
          <TabsContent value="health"><HealthCheckPanel embedded /></TabsContent>
        </Tabs>
      </div>

      <AddCreditsDialog open={addCreditsDialog} onOpenChange={setAddCreditsDialog} email={selectedUser?.email || ''} credits={creditsToAdd} setCredits={setCreditsToAdd} isPending={addCreditsMutation.isPending} onSubmit={handleAddCredits} />
      <EmailDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen} emailTo={emailTo} subject={emailSubject} setSubject={setEmailSubject} body={emailBody} setBody={setEmailBody} isPending={sendEmailMutation.isPending} onSubmit={handleSendEmail} />
      <DeleteUserDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} email={userToDelete?.email || ''} isPending={deleteUserMutation.isPending} onConfirm={() => { if (userToDelete) deleteUserMutation.mutate(userToDelete.userId, { onSuccess: () => { setDeleteDialogOpen(false); setUserToDelete(null); } }); }} />
      <CustomerHistoryDialog customer={selectedCustomer} open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} />
      <BulkEmailDialog open={bulkEmailDialogOpen} onOpenChange={(open) => { setBulkEmailDialogOpen(open); if (!open) setSelectedUserIds(new Set()); }} selectedUsers={filteredUsersForEmail} />
    </div>
  );
}
