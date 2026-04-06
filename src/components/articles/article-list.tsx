import { useMemo } from "react";
import { CheckCheck } from "lucide-react";
import { useArticleStore } from "@/stores/article-store.ts";
import { useFeedStore } from "@/stores/feed-store.ts";
import { ALL_FEEDS_ID } from "@/utils/constants.ts";
import { Button } from "@/components/ui/button.tsx";
import { ArticleItem } from "./article-item.tsx";
import type { Article } from "@/types/index.ts";

interface ArticleListProps {
  onArticleSelect?: (article: Article) => void;
}

export function ArticleList({ onArticleSelect }: ArticleListProps) {
  const selectedFeedId = useFeedStore((s) => s.selectedFeedId);
  const feeds = useFeedStore((s) => s.feeds);
  const articles = useArticleStore((s) => s.articles);
  const selectedArticle = useArticleStore((s) => s.selectedArticle);
  const selectArticle = useArticleStore((s) => s.selectArticle);
  const markAllAsRead = useArticleStore((s) => s.markAllAsRead);
  const isLoading = useArticleStore((s) => s.isLoading);
  const isGlobalView = selectedFeedId === ALL_FEEDS_ID;
  const unreadCount = articles.filter((a) => !a.read).length;

  const feedsById = useMemo(
    () => Object.fromEntries(feeds.map((f) => [f.id, f])),
    [feeds],
  );

  function handleSelect(article: Article) {
    selectArticle(article);
    if (onArticleSelect) onArticleSelect(article);
  }

  if (!selectedFeedId) {
    return (
      <div className="p-2 text-muted-foreground text-sm">
        Select a feed to view articles.
      </div>
    );
  }

  return (
    <>
      {articles.length > 0 && (
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="min-w-16">{unreadCount > 0 ? `${unreadCount} unread` : "All read"}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              disabled={unreadCount === 0}
              onClick={markAllAsRead}
            >
              <CheckCheck className="size-3 mr-1" />
              Mark all read
            </Button>
          </div>
        </div>
      )}
      {articles.length === 0 ? (
        // Don't show empty state during loading — prevents flash between feeds
        isLoading ? null : (
          <div className="p-2 text-muted-foreground text-sm">
            No articles found.
          </div>
        )
      ) : (
        <ul role="listbox" aria-label="Articles" className="list-none m-0 p-0">
          {articles.map((article) => (
            <ArticleItem
              key={article.id}
              article={article}
              isSelected={article.id === selectedArticle?.id}
              onSelect={handleSelect}
              feedTitle={
                isGlobalView ? feedsById[article.feedId]?.title : undefined
              }
              feedSiteUrl={
                isGlobalView ? feedsById[article.feedId]?.siteUrl : undefined
              }
            />
          ))}
        </ul>
      )}
    </>
  );
}
