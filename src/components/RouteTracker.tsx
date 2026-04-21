import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/analytics';

/**
 * Tracks SPA route changes as GA4 page_view events.
 * Must be rendered inside <BrowserRouter>.
 */
export function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Defer to next tick so document.title is updated by react-helmet-async first
    const id = window.setTimeout(() => {
      trackPageView(location.pathname + location.search, document.title);
    }, 0);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search]);

  return null;
}
