export interface ChangelogRelease {
  version: string;
  date: string;
  title: string;
  subtitle: string;
  /** Bullet-point items for the summary view. */
  items: string[];
  /** Rich HTML content for the blog-style article (optional). */
  richContent?: string;
}

export const releases: ChangelogRelease[] = [
  {
    version: "0.3.1",
    date: "2026-04-06",
    title: "More space to read",
    subtitle: "Reclaimed vertical space, unread badges, instant feed switching, and infinite scroll.",
    items: [
      "Feed source now shown in reader with favicon and name",
      "Removed desktop header bar — full vertical space for content",
      "Unread count badges in the sidebar per feed",
      "Preload all articles at startup — instant feed switching",
      "\"Load more\" button for feeds with 25+ articles",
      "Floating \"Mark N read\" pill replaces toolbar",
      "Favicons auto-refresh weekly, no manual reload needed",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-04-06",
    title: "Cleaner feeds",
    subtitle: "Tracking pixels, ad click IDs, and UTM parameters stripped automatically. Your feeds, without the surveillance.",
    items: [
      "Tracking pixels stripped from all feed content",
      "UTM parameters and ad click IDs removed from all links",
      "Anonymous feed catalog for future recommendations",
      "Improved changelog with arrow navigation between releases",
    ],
  },
  {
    version: "0.2.2",
    date: "2026-03-29",
    title: "Bug fixes",
    subtitle: "Small improvements and fixes.",
    items: [
      "Fixed favicon loading for sites with non-standard icon paths",
      "Improved feed refresh reliability",
      "Better error messages when adding invalid URLs",
    ],
  },
  {
    version: "0.2.1",
    date: "2026-03-28",
    title: "Visual polish",
    subtitle: "Warmer palette, smooth transitions, and a refined reading experience.",
    items: [
      "Warm background tint and blue-indigo accents",
      "Smooth hover, select, and sidebar transitions",
      "Refined blockquotes, framed images, editorial typography",
      "Unread/read states with bold titles and accent bars",
      "Softer focus rings and reduced-motion support",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-03-28",
    title: "Find your next read",
    subtitle: "Discover feeds, navigate by keyboard, and keep your reading private.",
    items: [
      "Explore 1,000+ feeds by topic or country",
      "Full keyboard navigation — j/k, Enter, Space, h, o",
      "Unread dots and mark-all-read",
      "Instant feed switching with in-memory cache",
      "Cloud sync with 4-word passphrase",
      "OPML import and export",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-01-31",
    title: "A private RSS reader",
    subtitle: "Read feeds with end-to-end encryption. No accounts, no tracking.",
    items: [
      "RSS 2.0, Atom 1.0, and JSON Feed support",
      "Zero-knowledge AES-256 encryption",
      "Cloud sync with passphrase",
      "Full-text article extraction",
      "Dark mode",
      "Keyboard navigation",
    ],
  },
];
