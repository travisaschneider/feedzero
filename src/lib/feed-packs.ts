export interface FeedPackSource {
  name: string;
  feedUrl: string;
  siteUrl: string;
}

export interface FeedPack {
  id: string;
  name: string;
  description: string;
  sources: FeedPackSource[];
}

export const feedPacks: FeedPack[] = [
  {
    id: "news",
    name: "World News",
    description: "Major global news sources",
    sources: [
      {
        name: "BBC News",
        feedUrl: "https://feeds.bbci.co.uk/news/rss.xml",
        siteUrl: "https://www.bbc.co.uk/news",
      },
      {
        name: "New York Times",
        feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
        siteUrl: "https://www.nytimes.com",
      },
      {
        name: "The Guardian",
        feedUrl: "https://www.theguardian.com/world/rss",
        siteUrl: "https://www.theguardian.com",
      },
      {
        name: "NPR",
        feedUrl: "https://feeds.npr.org/1001/rss.xml",
        siteUrl: "https://www.npr.org",
      },
      {
        name: "Al Jazeera",
        feedUrl: "https://www.aljazeera.com/xml/rss/all.xml",
        siteUrl: "https://www.aljazeera.com",
      },
    ],
  },
  {
    id: "tech",
    name: "Tech & Blogs",
    description: "Technology news and independent voices",
    sources: [
      {
        name: "Daring Fireball",
        feedUrl: "https://daringfireball.net/feeds/main",
        siteUrl: "https://daringfireball.net",
      },
      {
        name: "Ars Technica",
        feedUrl: "https://feeds.arstechnica.com/arstechnica/index",
        siteUrl: "https://arstechnica.com",
      },
      {
        name: "The Verge",
        feedUrl: "https://www.theverge.com/rss/index.xml",
        siteUrl: "https://www.theverge.com",
      },
      {
        name: "TechCrunch",
        feedUrl: "https://techcrunch.com/feed/",
        siteUrl: "https://techcrunch.com",
      },
      {
        name: "kottke.org",
        feedUrl: "https://kottke.org/feeds/main",
        siteUrl: "https://kottke.org",
      },
    ],
  },
];
