/**
 * GDPR-compliant page view tracking utility
 *
 * Privacy features:
 * - No cookies or localStorage
 * - No personal data collected
 * - Only tracks recipe slug and timestamp
 * - Bot detection to avoid fake views
 * - Uses navigator.sendBeacon() for reliable tracking without blocking page load
 */

/**
 * Checks if the current visitor is likely a bot/crawler
 */
function isBot(): boolean {
  // Check for headless browsers or known bots
  if (typeof navigator === "undefined") return true;

  if (navigator.webdriver) return true;

  const userAgent = navigator.userAgent.toLowerCase();
  const botPatterns = [
    "bot",
    "crawler",
    "spider",
    "scraper",
    "curl",
    "wget",
    "lighthouse",
    "pagespeed",
  ];

  return botPatterns.some((pattern) => userAgent.includes(pattern));
}

/**
 * Tracks a page view for the given recipe slug
 *
 * @param slug - The recipe slug to track
 * @returns Promise that resolves when tracking is complete (or void if sendBeacon is used)
 */
export async function trackRecipeView(slug: string): Promise<void> {
  // Don't track in development mode
  if (import.meta.env.DEV) {
    console.log(`[DEV] Would track view for: ${slug}`);
    return;
  }

  // Skip if bot detected
  if (isBot()) {
    console.log("[Tracking] Bot detected, skipping view tracking");
    return;
  }

  // Skip if slug is invalid
  if (!slug || typeof slug !== "string" || slug.trim() === "") {
    console.warn("[Tracking] Invalid slug provided");
    return;
  }

  const payload = JSON.stringify({
    slug: slug.trim(),
    timestamp: Date.now(),
  });

  // Use sendBeacon if available (recommended for page unload scenarios)
  if (typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" });
    const sent = navigator.sendBeacon("/api/track-view", blob);

    if (!sent) {
      console.warn("[Tracking] sendBeacon failed, falling back to fetch");
      // Fallback to fetch if sendBeacon fails
      await trackWithFetch(payload);
    }
  } else {
    // Fallback for older browsers
    await trackWithFetch(payload);
  }
}

/**
 * Fallback tracking method using fetch API
 */
async function trackWithFetch(payload: string): Promise<void> {
  try {
    await fetch("/api/track-view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
      // Don't wait for response, send and forget
      keepalive: true,
    });
  } catch (error) {
    // Silent fail - tracking should never break the user experience
    console.debug("[Tracking] Failed to track view:", error);
  }
}

/**
 * Initialize view tracking for the current page
 * Should be called once per page load
 *
 * @param slug - The recipe slug to track
 * @param options - Configuration options
 */
export function initViewTracking(
  slug: string,
  options: {
    delay?: number; // Delay in ms before tracking (default: 2000ms)
    threshold?: number; // How long user must stay on page in ms (default: 0)
  } = {}
): void {
  const { delay = 2000, threshold = 0 } = options;

  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    // Track immediately if user prefers reduced motion (no animations)
    setTimeout(() => trackRecipeView(slug), delay);
    return;
  }

  // Track after user has been on page for threshold duration
  const startTime = Date.now();

  const trackIfEngaged = () => {
    const timeOnPage = Date.now() - startTime;
    if (timeOnPage >= threshold) {
      trackRecipeView(slug);
    }
  };

  // Track after delay
  setTimeout(trackIfEngaged, delay + threshold);

  // Also track when user leaves page (if they engaged)
  window.addEventListener(
    "beforeunload",
    () => {
      if (Date.now() - startTime >= threshold) {
        trackRecipeView(slug);
      }
    },
    { once: true }
  );
}
