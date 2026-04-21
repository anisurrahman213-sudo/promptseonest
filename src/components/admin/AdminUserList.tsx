import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Users, Mail, Phone, User, MessageCircle, History, Trash2, MessageSquare, Images } from 'lucide-react';
import { UserFiltersComponent, filterUsers, UserFilters } from '@/components/admin/UserFilters';
import { UserListExport } from '@/components/admin/UserListExport';
import { MaskedEmail } from '@/components/admin/MaskedEmail';
import { VerifyEmailSyncButton } from '@/components/admin/VerifyEmailSyncButton';
import { UserGenerationsDialog } from '@/components/admin/UserGenerationsDialog';

interface AdminUserListProps {
  users: any[] | undefined;
  usersLoading: boolean;
  userFilters: UserFilters;
  setUserFilters: (filters: UserFilters) => void;
  selectedUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
  onToggleSelectAll: () => void;
  onOpenHistory: (user: any) => void;
  onOpenAddCredits: (userId: string, email: string) => void;
  onOpenEmail: (email: string) => void;
  onOpenDelete: (userId: string, email: string) => void;
  onOpenBulkEmail: () => void;
}

export function AdminUserList({
  users, usersLoading, userFilters, setUserFilters,
  selectedUserIds, onToggleUser, onToggleSelectAll,
  onOpenHistory, onOpenAddCredits, onOpenEmail, onOpenDelete, onOpenBulkEmail,
}: AdminUserListProps) {
  const [generationsUser, setGenerationsUser] = useState<any>(null);
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return filterUsers(users, userFilters);
  }, [users, userFilters]);

  if (usersLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!users || users.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No users found</h3>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <UserFiltersComponent filters={userFilters} onFiltersChange={setUserFilters} />

      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <Checkbox checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length} onCheckedChange={onToggleSelectAll} aria-label="Select all users" />
          <span className="text-sm text-muted-foreground">
            {selectedUserIds.size > 0 ? `${selectedUserIds.size} selected` : `${filteredUsers.length} users`}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <VerifyEmailSyncButton />
          <UserListExport users={filteredUsers} filename="customers" />
          {selectedUserIds.size > 0 && (
            <Button size="sm" onClick={onOpenBulkEmail} className="gap-2">
              <Mail className="h-4 w-4" />Email Selected ({selectedUserIds.size})
            </Button>
          )}
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No users match your filters</h3>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filter criteria</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((u: any) => (
            <Card key={u.user_id} className={selectedUserIds.has(u.user_id) ? 'ring-2 ring-primary' : ''}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <Checkbox checked={selectedUserIds.has(u.user_id)} onCheckedChange={() => onToggleUser(u.user_id)} aria-label={`Select ${u.full_name || u.email}`} />
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.full_name || 'No name'}</p>
                      <MaskedEmail email={u.email} />
                      {u.created_at && <p className="text-xs text-muted-foreground mt-0.5">Joined {format(new Date(u.created_at), 'MMM d, yyyy')}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Credits</p>
                      <p className="font-bold text-lg">{u.credits}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="default" size="sm" onClick={() => onOpenHistory(u)} title="View History" className="gap-1">
                        <History className="h-4 w-4" />History
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setGenerationsUser(u)} title="View All Generations" className="gap-1">
                        <Images className="h-4 w-4" />Generations
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onOpenAddCredits(u.user_id, u.email || 'Unknown')} title="Add Credits">
                        <Plus className="h-4 w-4 mr-1" />Credits
                      </Button>
                      {u.phone_number && (
                        <>
                          <a href={`tel:${u.phone_number}`}>
                            <Button variant="outline" size="icon" title={`Call ${u.phone_number}`}><Phone className="h-4 w-4" /></Button>
                          </a>
                          <a href={`sms:${u.phone_number}`}>
                            <Button variant="outline" size="icon" title={`SMS ${u.phone_number}`}><MessageSquare className="h-4 w-4" /></Button>
                          </a>
                          <a href={`https://wa.me/${u.phone_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="icon" className="text-green-600 hover:text-green-700" title="WhatsApp"><MessageCircle className="h-4 w-4" /></Button>
                          </a>
                        </>
                      )}
                      <Button variant="outline" size="icon" onClick={() => onOpenEmail(u.email)} title="Send Email" disabled={!u.email}>
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => onOpenDelete(u.user_id, u.email || 'Unknown')} title="Delete User">
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
  );
}
