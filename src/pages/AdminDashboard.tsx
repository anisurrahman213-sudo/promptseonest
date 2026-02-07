import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers, useIsAdmin, useDeleteUser, useSendCustomEmail } from '@/hooks/usePaymentRequests';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Users, CreditCard, ArrowLeft, ImageIcon, Wallpaper, Trash2, Mail, Phone, User, MessageCircle, History, Send, Video, Play } from 'lucide-react';
import { FeatureCardManagement } from '@/components/admin/FeatureCardManagement';
import { HeroBackgroundManagement } from '@/components/admin/HeroBackgroundManagement';
import { DemoVideoManagement } from '@/components/admin/DemoVideoManagement';
import { GenerationsManagement } from '@/components/admin/GenerationsManagement';
import { CustomerHistoryDialog } from '@/components/admin/CustomerHistoryDialog';
import { UserFiltersComponent, filterUsers, UserFilters } from '@/components/admin/UserFilters';
import { BulkEmailDialog } from '@/components/admin/BulkEmailDialog';
import { UserListExport } from '@/components/admin/UserListExport';
import { TutorialManagement } from '@/components/admin/TutorialManagement';
import { useAdminInactivityLogout } from '@/hooks/useAdminInactivityLogout';
 import { CreditSettings } from '@/components/admin/CreditSettings';

export default function AdminDashboard() {
  // Security: Auto-logout on inactivity
  useAdminInactivityLogout();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const deleteUserMutation = useDeleteUser();
  const sendEmailMutation = useSendCustomEmail();
  const queryClient = useQueryClient();

  const [addCreditsDialog, setAddCreditsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ userId: string; email: string } | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ userId: string; email: string } | null>(null);

  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Customer history dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // User filters state
  const [userFilters, setUserFilters] = useState<UserFilters>({
    search: '',
    minCredits: null,
    maxCredits: null,
    startDate: null,
    endDate: null,
  });

  // Selected users for bulk email
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkEmailDialogOpen, setBulkEmailDialogOpen] = useState(false);

  // Filter users based on current filters
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return filterUsers(users, userFilters);
  }, [users, userFilters]);

  const openHistoryDialog = (customer: any) => {
    setSelectedCustomer(customer);
    setHistoryDialogOpen(true);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.user_id)));
    }
  };

  const selectedUsersForEmail = useMemo(() => {
    return filteredUsers
      .filter(u => selectedUserIds.has(u.user_id))
      .map(u => ({ email: u.email, full_name: u.full_name }));
  }, [filteredUsers, selectedUserIds]);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user || !isAdmin) {
        navigate('/');
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const addCreditsMutation = useMutation({
    mutationFn: async ({ userId, credits }: { userId: string; credits: number }) => {
      const { error } = await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_credits: credits,
      });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`${creditsToAdd} credits added successfully!`);
      setAddCreditsDialog(false);
      setCreditsToAdd('');
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add credits');
    },
  });

  const handleAddCredits = () => {
    if (!selectedUser || !creditsToAdd) return;
    const credits = parseInt(creditsToAdd);
    if (isNaN(credits) || credits <= 0) {
      toast.error('Please enter a valid number of credits');
      return;
    }
    addCreditsMutation.mutate({ userId: selectedUser.userId, credits });
  };

  const openAddCreditsDialog = (userId: string, email: string) => {
    setSelectedUser({ userId, email });
    setCreditsToAdd('');
    setAddCreditsDialog(true);
  };

  const openDeleteDialog = (userId: string, email: string) => {
    setUserToDelete({ userId, email });
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate(userToDelete.userId, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      },
    });
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

  // Show loading state
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if not admin
  if (!user || !isAdmin) {
    return null;
  }

  const totalUsers = users?.length || 0;
  const totalCredits = users?.reduce((sum, u) => sum + (u.credits || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users & credits</p>
          </div>
        </div>

        {/* Tabs for different admin sections */}
        <Tabs defaultValue="users" className="space-y-6">
           <TabsList className="grid w-full max-w-5xl grid-cols-7">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
             <TabsTrigger value="credits" className="gap-2">
               <CreditCard className="h-4 w-4" />
               <span className="hidden sm:inline">Credits</span>
             </TabsTrigger>
            <TabsTrigger value="generations" className="gap-2">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Generations</span>
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="gap-2">
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Tutorials</span>
            </TabsTrigger>
            <TabsTrigger value="demo" className="gap-2">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Demo</span>
            </TabsTrigger>
            <TabsTrigger value="hero" className="gap-2">
              <Wallpaper className="h-4 w-4" />
              <span className="hidden sm:inline">Hero BG</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCredits.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Users List with Filters */}
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !users || users.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No users found</h3>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* User Filters */}
                <UserFiltersComponent 
                  filters={userFilters} 
                  onFiltersChange={setUserFilters} 
                />

                {/* Bulk Actions Bar */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all users"
                    />
                    <span className="text-sm text-muted-foreground">
                      {selectedUserIds.size > 0 
                        ? `${selectedUserIds.size} selected` 
                        : `${filteredUsers.length} users`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserListExport users={filteredUsers} filename="customers" />
                    {selectedUserIds.size > 0 && (
                      <Button 
                        size="sm" 
                        onClick={() => setBulkEmailDialogOpen(true)}
                        className="gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Email Selected ({selectedUserIds.size})
                      </Button>
                    )}
                  </div>
                </div>

                {/* User List */}
                {filteredUsers.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">No users match your filters</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Try adjusting your search or filter criteria
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {filteredUsers.map((u: any) => (
                      <Card 
                        key={u.user_id} 
                        className={selectedUserIds.has(u.user_id) ? 'ring-2 ring-primary' : ''}
                      >
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                              <Checkbox 
                                checked={selectedUserIds.has(u.user_id)}
                                onCheckedChange={() => toggleUserSelection(u.user_id)}
                                aria-label={`Select ${u.full_name || u.email}`}
                              />
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{u.full_name || 'No name'}</p>
                                <p className="text-sm text-muted-foreground">{u.email}</p>
                                {u.created_at && (
                                  <p className="text-xs text-muted-foreground">
                                    Joined {format(new Date(u.created_at), 'MMM d, yyyy')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Credits</p>
                                <p className="font-bold text-lg">{u.credits}</p>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => openHistoryDialog(u)}
                                  title="View History"
                                  className="gap-1"
                                >
                                  <History className="h-4 w-4" />
                                  History
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openAddCreditsDialog(u.user_id, u.email || 'Unknown')}
                                  title="Add Credits"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Credits
                                </Button>
                                {u.phone_number && (
                                  <>
                                    <a href={`tel:${u.phone_number}`}>
                                      <Button variant="outline" size="icon" title="Call">
                                        <Phone className="h-4 w-4" />
                                      </Button>
                                    </a>
                                    <a 
                                      href={`https://wa.me/${u.phone_number.replace(/[^0-9]/g, '')}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      <Button variant="outline" size="icon" className="text-green-600 hover:text-green-700" title="WhatsApp">
                                        <MessageCircle className="h-4 w-4" />
                                      </Button>
                                    </a>
                                  </>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => openEmailDialog(u.email)}
                                  title="Email"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  onClick={() => openDeleteDialog(u.user_id, u.email || 'Unknown')}
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="generations">
             <GenerationsManagement />
           </TabsContent>
 
           <TabsContent value="credits">
             <CreditSettings />
           </TabsContent>
 
          <TabsContent value="tutorials">
            <TutorialManagement />
          </TabsContent>

          <TabsContent value="demo">
            <DemoVideoManagement />
          </TabsContent>

          <TabsContent value="hero">
            <HeroBackgroundManagement />
          </TabsContent>

          <TabsContent value="features">
            <FeatureCardManagement />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Credits Dialog */}
      <Dialog open={addCreditsDialog} onOpenChange={setAddCreditsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
            <DialogDescription>
              Add credits to user: <strong>{selectedUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Number of Credits</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                placeholder="Enter amount (e.g., 1000)"
                value={creditsToAdd}
                onChange={(e) => setCreditsToAdd(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCreditsDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCredits}
              disabled={addCreditsMutation.isPending || !creditsToAdd}
            >
              {addCreditsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Credits'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to: <strong>{emailTo}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Enter email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Message</Label>
              <Textarea
                id="email-body"
                placeholder="Enter your message..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
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
              disabled={sendEmailMutation.isPending || !emailSubject || !emailBody}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>{userToDelete?.email}</strong>?
              </p>
              <p className="text-destructive font-medium">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>User account & profile</li>
                <li>All generated images</li>
                <li>Payment history</li>
                <li>All other associated data</li>
              </ul>
              <p className="text-destructive text-sm font-medium">
                This action cannot be undone!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Customer History Dialog */}
      <CustomerHistoryDialog
        customer={selectedCustomer}
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />

      {/* Bulk Email Dialog */}
      <BulkEmailDialog
        open={bulkEmailDialogOpen}
        onOpenChange={(open) => {
          setBulkEmailDialogOpen(open);
          if (!open) setSelectedUserIds(new Set());
        }}
        selectedUsers={selectedUsersForEmail}
      />
    </div>
  );
}
