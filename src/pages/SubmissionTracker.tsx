import { useState, useMemo } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, BarChart3, CheckCircle2, XCircle, Clock, TrendingUp, Loader2, FileBarChart } from 'lucide-react';
import { format } from 'date-fns';

const PLATFORMS = [
  'Adobe Stock', 'Shutterstock', 'Freepik', 'Getty Images', 'iStock',
  'Dreamstime', 'Depositphotos', 'Vecteezy', 'Alamy', '123RF', 'Pond5',
];

interface Submission {
  id: string;
  user_id: string;
  generation_id: string | null;
  image_name: string;
  platform: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export default function SubmissionTracker() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [imageName, setImageName] = useState('');
  const [platform, setPlatform] = useState('Adobe Stock');
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submission_tracking')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data as Submission[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('submission_tracking').insert({
        user_id: user!.id,
        image_name: imageName.trim(),
        platform,
        status,
        rejection_reason: status === 'rejected' ? rejectionReason.trim() || null : null,
        notes: notes.trim() || null,
        reviewed_at: status !== 'pending' ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast.success('Submission tracked!');
      setOpen(false);
      setImageName(''); setRejectionReason(''); setNotes(''); setStatus('pending');
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: 'pending' | 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('submission_tracking')
        .update({ status: newStatus, reviewed_at: newStatus !== 'pending' ? new Date().toISOString() : null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['submissions'] }); toast.success('Updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('submission_tracking').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['submissions'] }); toast.success('Deleted'); },
  });

  const stats = useMemo(() => {
    const total = submissions.length;
    const approved = submissions.filter(s => s.status === 'approved').length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    const reviewed = approved + rejected;
    const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0;

    const byPlatform: Record<string, { total: number; approved: number; rejected: number; pending: number }> = {};
    for (const s of submissions) {
      if (!byPlatform[s.platform]) byPlatform[s.platform] = { total: 0, approved: 0, rejected: 0, pending: 0 };
      byPlatform[s.platform].total++;
      byPlatform[s.platform][s.status]++;
    }
    return { total, approved, rejected, pending, approvalRate, byPlatform };
  }, [submissions]);

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;

  const StatusBadge = ({ s }: { s: string }) => {
    if (s === 'approved') return <Badge className="bg-success/15 text-success border-success/30">Approved</Badge>;
    if (s === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Submission Tracker — Multi-Platform Stock"
        description="Track your stock photo submissions across Adobe Stock, Shutterstock, Freepik, and more. See approval rates per platform."
        path="/submission-tracker"
      />
      <Header />
      <main className="container py-8 max-w-6xl">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <FileBarChart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Submission Tracker</h1>
              <p className="text-muted-foreground">Track submissions across all stock platforms</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />Add Submission</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Track New Submission</DialogTitle>
                <DialogDescription>Log an image submitted to a stock platform.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Image Name *</Label>
                  <Input value={imageName} onChange={(e) => setImageName(e.target.value)} placeholder="sunset-beach-001.jpg" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Platform *</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {status === 'rejected' && (
                  <div className="space-y-2">
                    <Label>Rejection Reason</Label>
                    <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Focus issues, trademark..." rows={2} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any extra notes..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => addMutation.mutate()} disabled={!imageName.trim() || addMutation.isPending}>
                  {addMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
          <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground">Approved</div><div className="text-2xl font-bold text-success">{stats.approved}</div></CardContent></Card>
          <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground">Rejected</div><div className="text-2xl font-bold text-destructive">{stats.rejected}</div></CardContent></Card>
          <Card><CardContent className="py-4"><div className="text-xs text-muted-foreground">Pending</div><div className="text-2xl font-bold">{stats.pending}</div></CardContent></Card>
          <Card className="border-primary/30"><CardContent className="py-4"><div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />Approval Rate</div><div className="text-2xl font-bold text-primary">{stats.approvalRate}%</div></CardContent></Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Submissions</TabsTrigger>
            <TabsTrigger value="platforms"><BarChart3 className="h-4 w-4 mr-1" />Per Platform</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
                ) : submissions.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <FileBarChart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No submissions tracked yet. Click "Add Submission" to start.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium max-w-[200px] truncate" title={s.image_name}>{s.image_name}</TableCell>
                          <TableCell><Badge variant="outline">{s.platform}</Badge></TableCell>
                          <TableCell><StatusBadge s={s.status} /></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(s.submitted_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              {s.status === 'pending' && (
                                <>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={() => updateStatus.mutate({ id: s.id, newStatus: 'approved' })} title="Mark approved">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => updateStatus.mutate({ id: s.id, newStatus: 'rejected' })} title="Mark rejected">
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {s.status !== 'pending' && (
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateStatus.mutate({ id: s.id, newStatus: 'pending' })} title="Reset to pending">
                                  <Clock className="h-4 w-4" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { if (confirm('Delete this submission?')) deleteMutation.mutate(s.id); }} title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platforms">
            {Object.keys(stats.byPlatform).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No platform data yet.</CardContent></Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(stats.byPlatform).sort((a, b) => b[1].total - a[1].total).map(([p, d]) => {
                  const reviewed = d.approved + d.rejected;
                  const rate = reviewed > 0 ? Math.round((d.approved / reviewed) * 100) : 0;
                  return (
                    <Card key={p}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex justify-between items-center">
                          <span>{p}</span>
                          <Badge className="bg-primary/10 text-primary border-primary/30" variant="outline">{rate}% approval</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div><div className="text-xs text-muted-foreground">Total</div><div className="text-xl font-bold">{d.total}</div></div>
                          <div><div className="text-xs text-muted-foreground">✅</div><div className="text-xl font-bold text-success">{d.approved}</div></div>
                          <div><div className="text-xs text-muted-foreground">❌</div><div className="text-xl font-bold text-destructive">{d.rejected}</div></div>
                          <div><div className="text-xs text-muted-foreground">⏳</div><div className="text-xl font-bold">{d.pending}</div></div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
