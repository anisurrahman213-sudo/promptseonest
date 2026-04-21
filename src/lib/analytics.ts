/**
 * Google Analytics 4 (GA4) helper utilities.
 * The gtag.js script is loaded in index.html.
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = 'G-HFM7VF0TCG';

/** Track a SPA page view (called by RouteTracker on every route change). */
export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title ?? document.title,
    send_to: GA_MEASUREMENT_ID,
  });
}

/** Track a custom event. */
export function trackEvent(
  eventName: string,
  params: Record<string, unknown> = {}
) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

/** Common helpers for key business events. */
export const analytics = {
  signUp: (method: string) => trackEvent('sign_up', { method }),
  login: (method: string) => trackEvent('login', { method }),
  generationCreated: (mediaType: string, count = 1) =>
    trackEvent('generation_created', { media_type: mediaType, count }),
  exportCompleted: (platform: string, count = 1) =>
    trackEvent('export_completed', { platform, count }),
  pricingViewed: () => trackEvent('pricing_viewed'),
  paymentRequested: (plan: string, amount: number, currency: string) =>
    trackEvent('payment_requested', { plan, value: amount, currency }),
};
