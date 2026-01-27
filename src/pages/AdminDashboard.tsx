import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers, useIsAdmin, useDeleteUser } from '@/hooks/usePaymentRequests';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Users, CreditCard, ArrowLeft, ImageIcon, Wallpaper, Trash2 } from 'lucide-react';
import { FeatureCardManagement } from '@/components/admin/FeatureCardManagement';
import { HeroBackgroundManagement } from '@/components/admin/HeroBackgroundManagement';
import { GenerationsManagement } from '@/components/admin/GenerationsManagement';
import { useAdminInactivityLogout } from '@/hooks/useAdminInactivityLogout';

export default function AdminDashboard() {
  // Security: Auto-logout on inactivity
  useAdminInactivityLogout();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const deleteUserMutation = useDeleteUser();
  const queryClient = useQueryClient();

  const [addCreditsDialog, setAddCreditsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ userId: string; email: string } | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ userId: string; email: string } | null>(null);

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
            <p className="text-muted-foreground">Manage user credits</p>
          </div>
        </div>

        {/* Tabs for different admin sections */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="generations" className="gap-2">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Generations</span>
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

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage credits for all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !users || users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                ) : (
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User Info</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Signup Date</TableHead>
                          <TableHead className="text-center">Credits</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.user_id}>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-medium">{u.full_name || 'No Name'}</p>
                                <p className="text-sm text-muted-foreground">{u.email || 'N/A'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{u.phone_number || 'No Phone'}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">
                                {u.created_at 
                                  ? new Date(u.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                  : 'N/A'
                                }
                              </p>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="font-mono">
                                {u.credits || 0}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => openAddCreditsDialog(u.user_id, u.email || 'Unknown')}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Credits
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openDeleteDialog(u.user_id, u.email || 'Unknown')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generations">
            <GenerationsManagement />
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
    </div>
  );
}
