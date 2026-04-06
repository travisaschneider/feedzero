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

// --- Rich content blocks ---

const v031RichContent = `
<h2>We killed the header bar</h2>
<p>There was a bar at the top of the screen that had… a sidebar toggle icon. That's it. It was eating 40 pixels on every page. It's gone now. The sidebar rail (that thin line on the left edge) still works for toggling, and <code>[</code> on the keyboard still works too.</p>

<p>While we were at it, we also killed the toolbar above the article list — the one with "12 unread" and a mark-all-read button. Replaced it with a floating pill that shows up only when you have unread articles:</p>

<div class="flex justify-center my-6">
  <div class="rounded-full bg-gray-100 border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm flex items-center gap-1.5">
    <span>✓✓</span> Mark 12 read
  </div>
</div>

<h3>You can now see which feed an article is from</h3>
<p>This sounds obvious but it wasn't there before. When you're reading an article, the feed's favicon and name now show up right below the title. Here's what it looks like:</p>

<div class="rounded-lg border bg-white p-3 my-6">
  <div class="text-lg font-semibold tracking-tight mb-1">Scientists Find New Signal from Deep Space</div>
  <div class="flex items-center gap-2 text-xs text-gray-500">
    <div class="w-3.5 h-3.5 rounded-sm bg-orange-400"></div>
    <span class="font-medium text-gray-700">Ars Technica</span>
    <span>&bull;</span>
    <span>Apr 6, 2026, 2:30 PM</span>
  </div>
</div>

<h3>Unread badges in the sidebar</h3>
<p>Each feed now shows how many unread articles it has. The count comes from all your articles, not just the first 25. When you hover over a feed to get the action menu, the badge fades out so they don't overlap.</p>

<div class="flex-1 rounded-xl border bg-white p-3 my-6">
  <div class="flex items-center gap-2 mb-2">
    <div class="w-3.5 h-3.5 rounded-sm bg-orange-400"></div>
    <span class="text-xs font-medium flex-1">Ars Technica</span>
    <span class="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] font-semibold">12</span>
  </div>
  <div class="flex items-center gap-2">
    <div class="w-3.5 h-3.5 rounded-sm bg-green-500"></div>
    <span class="text-xs font-medium flex-1">Hacker News</span>
    <span class="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] font-semibold">25+</span>
  </div>
  <div class="flex items-center gap-2 mt-2">
    <div class="w-3.5 h-3.5 rounded-sm bg-red-400"></div>
    <span class="text-xs font-medium flex-1 text-gray-400">The Verge</span>
    <span class="text-[10px] text-gray-300">all read</span>
  </div>
</div>

<h3>Switching feeds is instant now</h3>
<p>We preload all your articles into memory when the app starts. So when you click a feed, the articles are already there — no spinner, no delay. If a feed has more than 25 articles, there's a "Load more" button at the bottom to get older stuff.</p>

<h3>Favicons refresh themselves</h3>
<p>Previously you had to go into settings and click "Reload favicons" if an icon was broken. Now the cache expires automatically — successes after 7 days, failures after 24 hours. The menu item is gone.</p>
`;

const v030RichContent = `
<h2>So, RSS feeds are full of trackers</h2>
<p>You probably didn't know this. Most RSS feeds embed invisible 1×1 pixel images that phone home to Facebook, Google Analytics, and other tracking services. Every link has <code>utm_source</code>, <code>fbclid</code>, and other junk appended. You're being tracked even in your RSS reader.</p>

<p>We now strip all of that out before the content reaches your browser. Here's what gets removed:</p>

<div class="space-y-2 my-6">
  <div class="flex items-center gap-3 rounded-lg border p-2.5">
    <span class="text-sm">🔍</span>
    <div class="flex-1">
      <div class="text-xs font-semibold">Tracking pixels</div>
      <div class="text-[10px] text-gray-500">1×1 images from Facebook, Google Analytics, Quantserve, Feedburner, etc.</div>
    </div>
  </div>
  <div class="flex items-center gap-3 rounded-lg border p-2.5">
    <span class="text-sm">🔗</span>
    <div class="flex-1">
      <div class="text-xs font-semibold">URL tracking params</div>
      <div class="text-[10px] text-gray-500">utm_source, utm_medium, utm_campaign, fbclid, gclid, msclkid, and 20+ others</div>
    </div>
  </div>
  <div class="flex items-center gap-3 rounded-lg border p-2.5">
    <span class="text-sm">🛡️</span>
    <div class="flex-1">
      <div class="text-xs font-semibold">Ad click IDs</div>
      <div class="text-[10px] text-gray-500">From Microsoft, Snapchat, Twitter, Pinterest — all gone</div>
    </div>
  </div>
</div>

<h3>What a link looks like now</h3>
<p>Here's an actual before/after:</p>

<div class="grid gap-3 my-6">
  <div class="rounded-lg border p-3">
    <div class="text-[10px] font-semibold text-red-500 mb-1">BEFORE</div>
    <code class="text-[10px] text-gray-600 break-all">https://example.com/article?<mark class="bg-red-100 text-red-700">utm_source=rss&amp;utm_medium=feed&amp;utm_campaign=spring&amp;fbclid=abc123</mark></code>
  </div>
  <div class="rounded-lg border p-3">
    <div class="text-[10px] font-semibold text-green-600 mb-1">AFTER</div>
    <code class="text-[10px] text-gray-600 break-all">https://example.com/article</code>
  </div>
</div>

<p>This happens transparently — you don't have to do anything. Every feed you read is cleaned before it reaches you.</p>

<h3>We also started tracking which feeds exist (not who reads them)</h3>
<p>When anyone fetches a feed through our proxy, we now record that the feed URL exists and how many times it's been requested — but not by whom. No user IDs, no sessions, no cookies. The server knows "BBC News exists." It has no idea that you read it.</p>

<p>This catalog is the foundation for future stuff — feed health monitoring, popularity rankings, maybe AI summaries someday. All built on the principle that knowing a feed exists is public information, but knowing who reads it is private.</p>
`;

const v020RichContent = `
<h2>This is the one where FeedZero became actually useful</h2>
<p>Up to now it was basically "paste a feed URL and read it." With 0.2, we added the stuff that makes it a real daily-driver reader.</p>

<h3>Explore tab</h3>
<p>There's now a catalog of 1,000+ feeds you can browse by topic or country. Or just paste any URL — it'll figure out if there's a feed there. The search box is in the sidebar under "Explore."</p>

<div class="rounded-lg border bg-white p-2.5 my-6">
  <div class="flex items-center gap-2 mb-2 rounded-md border bg-gray-50 px-2 py-1 text-xs text-gray-400">
    <span>🔍</span> nytimes.com
    <span class="ml-auto text-[10px] text-blue-500">Enter to add</span>
  </div>
  <div class="flex gap-1.5 flex-wrap">
    <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">Tech</span>
    <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">Science</span>
    <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">World</span>
    <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px]">Culture</span>
  </div>
</div>

<h3>Keyboard shortcuts</h3>
<p>If you're a keyboard person, you can now do everything without touching the mouse. The main ones:</p>

<div class="grid grid-cols-2 gap-2 my-6">
  <div class="rounded-lg border p-2.5 text-center">
    <div class="text-lg font-mono mb-1">j k</div>
    <div class="text-[10px] text-gray-500">Next / Previous</div>
  </div>
  <div class="rounded-lg border p-2.5 text-center">
    <div class="text-lg font-mono mb-1">h</div>
    <div class="text-[10px] text-gray-500">Full text view</div>
  </div>
  <div class="rounded-lg border p-2.5 text-center">
    <div class="text-lg font-mono mb-1">o</div>
    <div class="text-[10px] text-gray-500">Open original</div>
  </div>
  <div class="rounded-lg border p-2.5 text-center">
    <div class="text-lg font-mono mb-1">[</div>
    <div class="text-[10px] text-gray-500">Toggle sidebar</div>
  </div>
</div>

<h3>Cloud sync</h3>
<p>You can now sync your feeds across devices. It works with a 4-word passphrase — the server stores an encrypted blob and has no idea what's inside it. Even if someone hacks the server, they get a pile of encrypted noise.</p>

<div class="flex justify-center gap-2 my-6">
  <span class="rounded bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-mono">oak</span>
  <span class="rounded bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-mono">sun</span>
  <span class="rounded bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-mono">fox</span>
  <span class="rounded bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-mono">bell</span>
</div>

<p>Also in this release: OPML import/export (so you can bring your feeds from other readers), unread dots, and mark-all-read.</p>
`;

const v010RichContent = `
<h2>Why we built this</h2>
<p>Most RSS readers either died, got acquired and ruined, or quietly started collecting your data. We wanted something simple: paste a feed URL, read the articles, and have nobody watching over your shoulder.</p>

<p>So we built FeedZero. Everything you add is encrypted with AES-256 before it touches storage. There's no account to create, no email to provide, no analytics running in the background. Here's how it works:</p>

<div class="rounded-xl border bg-gray-50 p-4 my-6">
  <div class="space-y-2 text-xs">
    <div class="flex items-center gap-2">
      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold shrink-0">1</span>
      <span>You add a feed URL</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold shrink-0">2</span>
      <span>We fetch it through a proxy (so the feed publisher doesn't see your IP)</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold shrink-0">3</span>
      <span>Content gets sanitized to remove any scripts or XSS attempts</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0">4</span>
      <span>Everything is encrypted in your browser before being saved</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold shrink-0">5</span>
      <span>Data lives in your browser's IndexedDB — we never see it</span>
    </div>
  </div>
</div>

<p>This first release supports RSS 2.0, Atom, and JSON Feed. There's dark mode, keyboard navigation (j/k/o), and a full-text extraction feature for feeds that only give you summaries.</p>

<div class="grid grid-cols-3 gap-2 my-6">
  <div class="rounded-xl border p-3 text-center">
    <div class="text-2xl mb-1">🔒</div>
    <div class="text-xs font-semibold">AES-256</div>
    <div class="text-[10px] text-gray-500">Encrypted at rest</div>
  </div>
  <div class="rounded-xl border p-3 text-center">
    <div class="text-2xl mb-1">🌙</div>
    <div class="text-xs font-semibold">Dark mode</div>
    <div class="text-[10px] text-gray-500">Easier on the eyes</div>
  </div>
  <div class="rounded-xl border p-3 text-center">
    <div class="text-2xl mb-1">📖</div>
    <div class="text-xs font-semibold">Full text</div>
    <div class="text-[10px] text-gray-500">Extract full articles</div>
  </div>
</div>

<p>We're building this for people who care about their privacy — journalists, researchers, activists, or just anyone who's tired of being the product. It's open source, there's no telemetry, and there never will be.</p>
`;

// --- Release data ---

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
    richContent: v031RichContent,
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
    richContent: v030RichContent,
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
    richContent: v020RichContent,
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
    richContent: v010RichContent,
  },
];
