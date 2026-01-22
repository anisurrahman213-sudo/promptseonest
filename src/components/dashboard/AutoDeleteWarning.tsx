import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Trash2, Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { differenceInDays, differenceInHours } from 'date-fns';
import { Link } from 'react-router-dom';

interface Generation {
  id: string;
  created_at: string;
}

interface AutoDeleteWarningProps {
  generations: Generation[];
}

export function AutoDeleteWarning({ generations }: AutoDeleteWarningProps) {
  // Calculate stats
  const stats = useMemo(() => {
    if (generations.length === 0) {
      return { 
        expiringSoon: 0, 
        expiringToday: 0, 
        lastActivity: null, 
        daysSinceActivity: 0,
        isInactive: false
      };
    }

    const now = new Date();
    let expiringSoon = 0;
    let expiringToday = 0;

    generations.forEach(gen => {
      const created = new Date(gen.created_at);
      const deleteAt = new Date(created);
      deleteAt.setDate(deleteAt.getDate() + 3);
      const hoursRemaining = differenceInHours(deleteAt, now);

      if (hoursRemaining <= 24 && hoursRemaining > 0) {
        expiringToday++;
      }
      if (hoursRemaining <= 48 && hoursRemaining > 0) {
        expiringSoon++;
      }
    });

    // Find last activity
    const sorted = [...generations].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const lastActivity = new Date(sorted[0].created_at);
    const daysSinceActivity = differenceInDays(now, lastActivity);

    return {
      expiringSoon,
      expiringToday,
      lastActivity,
      daysSinceActivity,
      isInactive: daysSinceActivity >= 3
    };
  }, [generations]);

  // Don't show if no warnings needed
  if (generations.length === 0 && !stats.isInactive) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Main Auto-Delete Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-destructive/30 bg-gradient-to-r from-destructive/5 via-destructive/10 to-destructive/5 p-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/20 shrink-0">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-destructive flex items-center gap-2 flex-wrap">
                <Clock className="h-4 w-4" />
                ⚠️ Auto-Delete সক্রিয়!
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                সব generations <strong>3 দিন</strong> পর স্বয়ংক্রিয়ভাবে মুছে যাবে। প্রয়োজনীয় ডেটা আগেই <strong>Export/Copy</strong> করে রাখুন!
              </p>
            </div>
          </div>
          <Link to="/dashboard" className="shrink-0">
            <Button variant="outline" size="sm" className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
              <Download className="h-4 w-4" />
              Export Now
            </Button>
          </Link>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-destructive/20 to-transparent rounded-full blur-2xl" />
      </motion.div>

      {/* Expiring Soon Warning */}
      {stats.expiringToday > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 shrink-0 animate-pulse">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-amber-600 dark:text-amber-400">
                🔥 {stats.expiringToday}টি generation আজ মুছে যাবে!
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                এই items গুলোর মেয়াদ আজ শেষ হচ্ছে। এখনই copy/export করুন!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Expiring in 48 hours */}
      {stats.expiringSoon > stats.expiringToday && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3"
        >
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-orange-600 dark:text-orange-400">
              <strong>{stats.expiringSoon}টি</strong> generation আগামী ২ দিনে মুছে যাবে
            </span>
          </div>
        </motion.div>
      )}

      {/* Inactivity Warning */}
      {stats.isInactive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 shrink-0">
              <AlertTriangle className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-purple-600 dark:text-purple-400">
                😴 {stats.daysSinceActivity} দিন ধরে Inactive!
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                আপনি গত {stats.daysSinceActivity} দিন কোনো ছবি আপলোড করেননি। আপনার পুরনো generations মুছে যাচ্ছে!
              </p>
              <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-purple-500 hover:text-purple-600 mt-2 font-medium">
                এখনই আপলোড করুন <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-xl" />
        </motion.div>
      )}
    </div>
  );
}
