import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, ShieldCheck, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface SyncReport {
  total: number;
  withEmail: number;
  missingEmail: number;
  emptyName: number;
  duplicates: number;
  checkedAt: string;
}

export function VerifyEmailSyncButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SyncReport | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setReport(null);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('email, full_name');

      if (error) throw error;

      const total = data?.length ?? 0;
      const withEmail = data?.filter((r) => r.email && r.email.trim() !== '').length ?? 0;
      const missingEmail = total - withEmail;
      const emptyName = data?.filter((r) => !r.full_name || r.full_name.trim() === '').length ?? 0;

      // Detect duplicate emails (case-insensitive)
      const emailMap = new Map<string, number>();
      data?.forEach((r) => {
        if (r.email) {
          const key = r.email.toLowerCase().trim();
          emailMap.set(key, (emailMap.get(key) ?? 0) + 1);
        }
      });
      const duplicates = Array.from(emailMap.values()).filter((c) => c > 1).length;

      setReport({
        total, withEmail, missingEmail, emptyName, duplicates,
        checkedAt: new Date().toLocaleString(),
      });

      if (missingEmail === 0 && duplicates === 0) {
        toast.success('All user emails are properly synced!');
      } else if (missingEmail > 0) {
        toast.warning(`${missingEmail} user(s) missing email`);
      } else {
        toast.warning(`Found ${duplicates} duplicate email(s)`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify email sync');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    runCheck();
  };

  const allHealthy = report && report.missingEmail === 0 && report.duplicates === 0;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpen}
        className="gap-2"
        title="Admin: Verify all user profile emails are synced"
      >
        <ShieldCheck className="h-4 w-4" />
        <span className="hidden sm:inline">Verify Email Sync</span>
        <span className="sm:hidden">Verify</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Email Sync Verification
            </DialogTitle>
            <DialogDescription>
              Checks every user profile for missing emails, missing names, and duplicates.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Scanning user profiles…</span>
            </div>
          ) : report ? (
            <div className="space-y-4">
              {allHealthy ? (
                <Card className="border-success/30 bg-success/5">
                  <CardContent className="py-4 flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
                    <div>
                      <p className="font-semibold text-success">All systems healthy</p>
                      <p className="text-sm text-muted-foreground">
                        Every user has a valid email and no duplicates were found.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-warning/30 bg-warning/5">
                  <CardContent className="py-4 flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-warning shrink-0" />
                    <div>
                      <p className="font-semibold text-warning">Issues detected</p>
                      <p className="text-sm text-muted-foreground">
                        Some user profiles need attention. Review the details below.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total Users" value={report.total} tone="neutral" />
                <StatCard label="With Email" value={report.withEmail} tone="success" />
                <StatCard label="Missing Email" value={report.missingEmail} tone={report.missingEmail > 0 ? 'destructive' : 'success'} />
                <StatCard label="Empty Name" value={report.emptyName} tone={report.emptyName > 0 ? 'warning' : 'success'} />
                <StatCard label="Duplicate Emails" value={report.duplicates} tone={report.duplicates > 0 ? 'destructive' : 'success'} />
                <StatCard
                  label="Sync Coverage"
                  value={`${report.total === 0 ? 0 : Math.round((report.withEmail / report.total) * 100)}%`}
                  tone={report.missingEmail === 0 ? 'success' : 'warning'}
                />
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Checked at {report.checkedAt}
              </p>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={runCheck} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Re-run Check
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatCard({
  label, value, tone,
}: {
  label: string;
  value: number | string;
  tone: 'neutral' | 'success' | 'warning' | 'destructive';
}) {
  const toneCls = {
    neutral: 'border-border bg-muted/30',
    success: 'border-success/30 bg-success/5',
    warning: 'border-warning/30 bg-warning/5',
    destructive: 'border-destructive/30 bg-destructive/5',
  }[tone];
  const valueCls = {
    neutral: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  }[tone];
  return (
    <div className={`rounded-lg border p-3 ${toneCls}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${valueCls}`}>{value}</p>
    </div>
  );
}
