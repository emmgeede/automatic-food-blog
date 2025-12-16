/**
 * Matomo Event Tracking Utilities
 *
 * Provides helper functions for tracking user interactions in Matomo
 * GDPR-compliant, cookieless tracking
 */

declare global {
  interface Window {
    _paq?: any[];
  }
}

/**
 * Track a custom event in Matomo
 * @param category - Event category (e.g., "Recipe", "Navigation", "Engagement")
 * @param action - Event action (e.g., "Click", "Scroll", "View")
 * @param name - Event name (optional)
 * @param value - Event value (optional, numeric)
 */
export function trackEvent(
  category: string,
  action: string,
  name?: string,
  value?: number
): void {
  if (typeof window === 'undefined' || !window._paq) return;

  try {
    if (name && value !== undefined) {
      window._paq.push(['trackEvent', category, action, name, value]);
    } else if (name) {
      window._paq.push(['trackEvent', category, action, name]);
    } else {
      window._paq.push(['trackEvent', category, action]);
    }
  } catch (error) {
    console.error('Matomo tracking error:', error);
  }
}

/**
 * Track button clicks
 */
export function trackButtonClick(buttonName: string, location?: string): void {
  trackEvent('Button', 'Click', location ? `${buttonName} (${location})` : buttonName);
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(percentage: number): void {
  trackEvent('Engagement', 'Scroll', `${percentage}%`, percentage);
}

/**
 * Track recipe interactions
 */
export function trackRecipeInteraction(action: string, detail?: string): void {
  trackEvent('Recipe', action, detail);
}

/**
 * Track time milestones
 */
export function trackTimeMilestone(seconds: number): void {
  trackEvent('Engagement', 'Time on Page', `${seconds}s`, seconds);
}

/**
 * Track external link clicks
 */
export function trackOutboundLink(url: string, linkType: 'Affiliate' | 'External' | 'Source' = 'External'): void {
  trackEvent('Outbound', linkType, url);
}

/**
 * Track site search
 */
export function trackSiteSearch(keyword: string, category?: string, resultsCount?: number): void {
  if (typeof window === 'undefined' || !window._paq) return;

  try {
    window._paq.push(['trackSiteSearch', keyword, category, resultsCount]);
  } catch (error) {
    console.error('Matomo site search tracking error:', error);
  }
}

/**
 * Set custom dimension
 */
export function setCustomDimension(id: number, value: string): void {
  if (typeof window === 'undefined' || !window._paq) return;

  try {
    window._paq.push(['setCustomDimension', id, value]);
  } catch (error) {
    console.error('Matomo custom dimension error:', error);
  }
}

/**
 * Initialize scroll tracking
 */
export function initScrollTracking(thresholds: number[] = [25, 50, 75, 100]): void {
  if (typeof window === 'undefined') return;

  const trackedThresholds = new Set<number>();
  let ticking = false;

  const checkScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;
    const percentage = Math.round((scrolled / scrollHeight) * 100);

    thresholds.forEach(threshold => {
      if (percentage >= threshold && !trackedThresholds.has(threshold)) {
        trackedThresholds.add(threshold);
        trackScrollDepth(threshold);
      }
    });

    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(checkScroll);
      ticking = true;
    }
  }, { passive: true });
}

/**
 * Initialize time tracking
 */
export function initTimeTracking(milestones: number[] = [30, 120, 300]): void {
  if (typeof window === 'undefined') return;

  const startTime = Date.now();
  const trackedMilestones = new Set<number>();

  const checkMilestones = () => {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    milestones.forEach(milestone => {
      if (elapsedSeconds >= milestone && !trackedMilestones.has(milestone)) {
        trackedMilestones.add(milestone);
        trackTimeMilestone(milestone);
      }
    });
  };

  // Check every 10 seconds
  setInterval(checkMilestones, 10000);
}

/**
 * Track download clicks
 */
export function trackDownload(fileName: string, fileType: string = 'PDF'): void {
  if (typeof window === 'undefined' || !window._paq) return;

  try {
    window._paq.push(['trackEvent', 'Download', fileType, fileName]);
  } catch (error) {
    console.error('Matomo download tracking error:', error);
  }
}
