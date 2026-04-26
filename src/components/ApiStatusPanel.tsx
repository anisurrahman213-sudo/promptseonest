import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
  Zap,
  Clock,
  Key,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ApiStatus {
  configured: boolean;
  valid: boolean;
  error: string | null;
  modelInfo?: string | null;
  dailyLimit: number;
  rpmLimit: number;
  usedToday: number;
  remaining: number;
  usagePercent: number;
  checkedAt: string;
}

export function ApiStatusPanel() {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('check-gemini-status');
      if (error) throw error;
      setStatus(data as ApiStatus);
    } catch (err) {
      console.error('Failed to fetch API status:', err);
      setStatus({
        configured: false,
        valid: false,
        error: err instanceof Error ? err.message : 'Failed to check status',
        dailyLimit: 1500,
        rpmLimit: 15,
        usedToday: 0,
        remaining: 0,
        usagePercent: 0,
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchStatus(), 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const getStatusBadge = () => {
    if (!status.configured) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Not Configured
        </Badge>
      );
    }
    if (!status.valid) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> Invalid Key
        </Badge>
      );
    }
    if (status.usagePercent >= 90) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" /> Quota Critical
        </Badge>
      );
    }
    if (status.usagePercent >= 70) {
      return (
        <Badge className="gap-1 bg-yellow-500 hover:bg-yellow-600 text-white">
          <AlertTriangle className="h-3 w-3" /> Quota High
        </Badge>
      );
    }
    return (
      <Badge className="gap-1 bg-green-500 hover:bg-green-600 text-white">
        <CheckCircle2 className="h-3 w-3" /> Active
      </Badge>
    );
  };

  const getProgressColor = () => {
    if (status.usagePercent >= 90) return 'bg-destructive';
    if (status.usagePercent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Gemini API Status
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchStatus(true)}
              disabled={refreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Validation Error Alert */}
        {!status.configured && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>API key not found.</strong> Please add your <code>GEMINI_API_KEY</code> in
              backend secrets to enable image processing.
            </AlertDescription>
          </Alert>
        )}

        {status.configured && !status.valid && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Invalid API key.</strong> {status.error || 'The key was rejected by Google.'}
              <br />
              Get a new key from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Google AI Studio
              </a>
              .
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Key className="h-3 w-3" /> API Key
            </div>
            <div className="text-sm font-semibold">
              {status.configured ? (status.valid ? 'Connected' : 'Invalid') : 'Missing'}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" /> Per-Minute Limit
            </div>
            <div className="text-sm font-semibold">{status.rpmLimit} requests</div>
          </div>
        </div>

        {/* Daily Quota Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium flex items-center gap-1.5">
              <Activity className="h-4 w-4" /> Today's Usage
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {status.usedToday} / {status.dailyLimit}
            </span>
          </div>
          <div className="relative">
            <Progress value={status.usagePercent} className="h-3" />
            <div
              className={`absolute inset-0 h-3 rounded-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(status.usagePercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{status.usagePercent}% used</span>
            <span
              className={`font-semibold ${
                status.remaining < 100
                  ? 'text-destructive'
                  : status.remaining < 300
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}
            >
              {status.remaining.toLocaleString()} remaining today
            </span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last checked{' '}
            {formatDistanceToNow(new Date(status.checkedAt), { addSuffix: true })}
          </div>
          {status.modelInfo && <span className="hidden sm:inline">{status.modelInfo}</span>}
        </div>

        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2 leading-relaxed">
          💡 <strong>Free tier limits:</strong> 1,500 requests/day & 15 requests/minute. Quota
          resets at midnight UTC. Estimated count is based on your generations today.
        </div>
      </CardContent>
    </Card>
  );
}
