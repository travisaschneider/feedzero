import { useState } from "react";
import { Rss } from "lucide-react";

interface FeedFaviconProps {
  siteUrl: string;
  className?: string;
}

/** Displays a feed's favicon proxied through /api/icon, with RSS icon fallback. */
export function FeedFavicon({
  siteUrl,
  className = "size-4",
}: FeedFaviconProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!siteUrl || failed) {
    return <Rss className={`${className} text-muted-foreground shrink-0`} />;
  }

  let faviconUrl: string;
  try {
    const url = new URL(siteUrl);
    const directUrl = `${url.origin}/favicon.ico`;
    faviconUrl = `/api/icon?url=${encodeURIComponent(directUrl)}`;
  } catch {
    return <Rss className={`${className} text-muted-foreground shrink-0`} />;
  }

  return (
    <>
      {!loaded && (
        <Rss className={`${className} text-muted-foreground shrink-0`} />
      )}
      <img
        src={faviconUrl}
        alt=""
        className={`${className} shrink-0 rounded-sm ${loaded ? "" : "hidden"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  );
}
