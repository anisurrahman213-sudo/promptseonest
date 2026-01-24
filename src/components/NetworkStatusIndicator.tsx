import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Wifi, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function NetworkStatusIndicator() {
  const { isOnline, isConnectedToBackend, latency, checkBackendConnection } = useNetworkStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const isSlowConnection = latency !== null && latency > 3000;

  useEffect(() => {
    if (!isOnline || !isConnectedToBackend) {
      setWasOffline(true);
    } else if (wasOffline && isOnline && isConnectedToBackend) {
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isConnectedToBackend, wasOffline]);

  const handleRetry = async () => {
    setIsRetrying(true);
    await checkBackendConnection();
    setIsRetrying(false);
  };

  return (
    <AnimatePresence>
      {/* Completely Offline */}
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm font-medium shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>আপনি অফলাইন আছেন। ইন্টারনেট সংযোগ চেক করুন।</span>
          </div>
        </motion.div>
      )}

      {/* Online but Backend Unreachable (VPN/Firewall issue) */}
      {isOnline && !isConnectedToBackend && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-warning text-warning-foreground py-2 px-4 text-center text-sm font-medium shadow-lg"
        >
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <AlertTriangle className="h-4 w-4" />
            <span>সার্ভারে সংযোগ করতে সমস্যা হচ্ছে। VPN বন্ধ করে আবার চেষ্টা করুন।</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="ml-2 h-7 text-xs"
            >
              {isRetrying ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Retry
            </Button>
          </div>
        </motion.div>
      )}

      {/* Slow Connection Warning */}
      {isOnline && isConnectedToBackend && isSlowConnection && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white py-2 px-4 text-center text-sm font-medium shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>ধীর সংযোগ ({Math.round(latency / 1000)}s)। VPN বন্ধ করলে দ্রুত হতে পারে।</span>
          </div>
        </motion.div>
      )}

      {/* Back Online Message */}
      {showBackOnline && isOnline && isConnectedToBackend && !isSlowConnection && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white py-2 px-4 text-center text-sm font-medium shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <Wifi className="h-4 w-4" />
            <span>আপনি আবার অনলাইন! ✨</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
