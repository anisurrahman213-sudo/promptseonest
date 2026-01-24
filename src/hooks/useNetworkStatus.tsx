import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NetworkStatus {
  isOnline: boolean;
  isConnectedToBackend: boolean;
  lastChecked: Date | null;
  latency: number | null;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConnectedToBackend: true,
    lastChecked: null,
    latency: null,
  });

  const checkBackendConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnectedToBackend: false,
        lastChecked: new Date(),
      }));
      return false;
    }

    const startTime = Date.now();
    
    try {
      // Simple health check - just try to get session (lightweight)
      const { error } = await supabase.auth.getSession();
      const latency = Date.now() - startTime;
      
      // If latency is too high (>10 seconds), consider it a problem
      const isHealthy = !error && latency < 10000;
      
      setStatus({
        isOnline: true,
        isConnectedToBackend: isHealthy,
        lastChecked: new Date(),
        latency,
      });
      
      return isHealthy;
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        isConnectedToBackend: false,
        lastChecked: new Date(),
        latency: null,
      }));
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      // Check backend connection when coming back online
      checkBackendConnection();
    };
    
    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnectedToBackend: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkBackendConnection();

    // Periodic check every 30 seconds if online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkBackendConnection();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkBackendConnection]);

  return {
    ...status,
    checkBackendConnection,
  };
}
