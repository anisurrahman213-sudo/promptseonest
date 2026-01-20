import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    const wasDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay
      if (!wasDismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (dismissed || !showPrompt || !deferredPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 p-4 bg-card border border-border rounded-xl shadow-xl"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        
        <div className="flex items-start gap-3 pr-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
            <Download className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">App Install করুন</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Home screen-এ add করুন দ্রুত access-এর জন্য। Offline-এও কাজ করবে!
            </p>
            <Button
              onClick={handleInstall}
              size="sm"
              className="mt-3 bg-gradient-primary hover:opacity-90"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Install App
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
