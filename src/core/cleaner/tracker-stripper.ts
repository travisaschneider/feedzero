/** Known tracker domains — images from these are always removed. */
const TRACKER_DOMAINS = [
  "pixel.quantserve.com",
  "sb.scorecardresearch.com",
  "analytics.twitter.com",
  "www.google-analytics.com",
  "www.facebook.com/tr",
  "feeds.feedburner.com",
  "feeds.feedblitz.com",
  "stats.wordpress.com",
  "pixel.wp.com",
  "tr.snapchat.com",
  "bat.bing.com",
  "ct.pinterest.com",
  "tags.tiqcdn.com",
];

const IMG_REGEX = /<img\b[^>]*>/gi;
const SRC_REGEX = /\bsrc=["']([^"']*)["']/i;
const WIDTH_REGEX = /\bwidth=["']?(\d+)["']?/i;
const HEIGHT_REGEX = /\bheight=["']?(\d+)["']?/i;

function isTrackerDomain(src: string): boolean {
  return TRACKER_DOMAINS.some((domain) => src.includes(domain));
}

function isTrackingPixel(imgTag: string): boolean {
  const srcMatch = imgTag.match(SRC_REGEX);
  if (!srcMatch) return false;
  const src = srcMatch[1];

  if (isTrackerDomain(src)) return true;

  const widthMatch = imgTag.match(WIDTH_REGEX);
  const heightMatch = imgTag.match(HEIGHT_REGEX);

  if (widthMatch && heightMatch) {
    const w = parseInt(widthMatch[1], 10);
    const h = parseInt(heightMatch[1], 10);
    if (w <= 1 && h <= 1) return true;
  }

  return false;
}

/** Remove tracking pixel images from HTML content. */
export function stripTrackers(html: string): string {
  return html.replace(IMG_REGEX, (imgTag) =>
    isTrackingPixel(imgTag) ? "" : imgTag,
  );
}
