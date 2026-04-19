import { useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { ChevronLeft } from "lucide-react";
import { useFeedStore } from "@/stores/feed-store.ts";
import { useArticleStore } from "@/stores/article-store.ts";
import { useIsDesktop } from "@/hooks/use-media-query.ts";
import { useKeyboardNav } from "@/hooks/use-keyboard-nav.ts";
import { useSidebar } from "@/components/ui/sidebar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { ALL_FEEDS_ID } from "@/utils/constants.ts";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable.tsx";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar.tsx";
import { AppSidebar } from "@/components/layout/app-sidebar.tsx";
import { HeaderBreadcrumbs } from "@/components/layout/header-breadcrumbs.tsx";
import { Kbd } from "@/components/ui/kbd.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { ArticleList } from "@/components/articles/article-list.tsx";
import { ReaderPanel } from "@/components/reader/reader-panel.tsx";
const ExploreCatalog = lazy(() =>
  import("@/components/explore/explore-catalog.tsx").then((m) => ({
    default: m.ExploreCatalog,
  })),
);

/**
 * Returns the default feed ID to show when no feed is selected.
 * Whenever any feeds exist, the All items aggregated view is the landing
 * destination — users should always see their full stream first, regardless
 * of how many feeds they subscribe to.
 */
function getDefaultFeedId(feeds: { id: string }[]): string | null {
  return feeds.length === 0 ? null : ALL_FEEDS_ID;
}

/**
 * Listens for the feedzero:toggle-sidebar event and toggles the sidebar.
 * Must be rendered inside SidebarProvider.
 */
function SidebarKeyboardToggle() {
  const { toggleSidebar } = useSidebar();
  useEffect(() => {
    const handler = () => toggleSidebar();
    document.addEventListener("feedzero:toggle-sidebar", handler);
    return () =>
      document.removeEventListener("feedzero:toggle-sidebar", handler);
  }, [toggleSidebar]);
  return null;
}

/**
 * Main page component.
 * Desktop: sidebar (feeds) + article list + reader pane.
 * Mobile: sidebar collapses to offcanvas, single panel navigation.
 */
export function FeedsPage() {
  const { feedId, articleId } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isExplorePage = pathname === "/explore";
  const isDesktop = useIsDesktop();
  useKeyboardNav();
  const feeds = useFeedStore((s) => s.feeds);
  const selectFeed = useFeedStore((s) => s.selectFeed);
  const loadArticles = useArticleStore((s) => s.loadArticles);
  const articles = useArticleStore((s) => s.articles);
  const selectArticle = useArticleStore((s) => s.selectArticle);

  // Navigate to /explore and focus search when N key or Plus button is used
  useEffect(() => {
    const handler = () => {
      navigate("/explore");
      setTimeout(() => {
        document.dispatchEvent(
          new CustomEvent("feedzero:focus-explore-search"),
        );
      }, 50);
    };
    document.addEventListener("feedzero:navigate-explore", handler);
    return () =>
      document.removeEventListener("feedzero:navigate-explore", handler);
  }, [navigate]);

  function handleFeedAdded(feedId: string) {
    handleFeedSelect(feedId);
  }

  // Track whether user explicitly navigated back (to suppress auto-select)
  const skipAutoSelectRef = useRef(false);

  // Auto-navigate to explore when no feeds exist, or to default feed when feeds exist
  useEffect(() => {
    if (isExplorePage) return;
    if (feeds.length === 0 && !feedId) {
      navigate("/explore", { replace: true });
    } else if (!feedId && feeds.length > 0) {
      const defaultFeedId = getDefaultFeedId(feeds);
      if (defaultFeedId) {
        navigate(`/feeds/${defaultFeedId}`, { replace: true });
      }
    }
  }, [isExplorePage, feedId, feeds, navigate]);

  const isLoadingArticles = useArticleStore((s) => s.isLoading);

  // Track which feedId we last triggered a load for, to avoid redundant loads
  const loadedFeedRef = useRef<string | null>(null);

  // Feed switch: select feed and start loading when feedId changes
  useEffect(() => {
    if (!feedId || feedId === loadedFeedRef.current) return;
    loadedFeedRef.current = feedId;
    selectFeed(feedId);
    selectArticle(null);
    loadArticles(feedId).then(() => {
      // After load, if no articleId in URL, auto-navigate to first article.
      // Doing it here (instead of a separate effect) avoids a render gap.
      const { articles: loaded } = useArticleStore.getState();
      if (loaded.length > 0 && !articleId && !skipAutoSelectRef.current) {
        navigate(`/feeds/${feedId}/articles/${loaded[0].id}`, {
          replace: true,
        });
      }
    });
  }, [feedId, selectFeed, selectArticle, loadArticles, articleId, navigate]);

  // Article sync + auto-select (single effect replaces three cascading effects).
  // Waits until loading completes, then either syncs articleId from URL
  // or auto-selects the first article. No cascading navigations.
  useEffect(() => {
    if (!feedId || isLoadingArticles || articles.length === 0) return;

    if (articleId) {
      const current = useArticleStore.getState().selectedArticle;
      if (current?.id === articleId) return;
      const article = articles.find((a) => a.id === articleId);
      if (article) selectArticle(article);
    } else if (!skipAutoSelectRef.current) {
      navigate(`/feeds/${feedId}/articles/${articles[0].id}`, {
        replace: true,
      });
    }
  }, [feedId, articleId, articles, isLoadingArticles, selectArticle, navigate]);

  // Reset skip flag when user navigates to an article
  useEffect(() => {
    if (articleId) {
      skipAutoSelectRef.current = false;
    }
  }, [articleId]);

  function handleFeedSelect(id: string) {
    navigate(`/feeds/${id}`);
  }

  function handleArticleSelect(article: { id: string }) {
    if (!feedId) return;
    // Select article immediately for instant UI response, then sync URL
    const fullArticle = articles.find((a) => a.id === article.id);
    if (fullArticle) selectArticle(fullArticle);
    navigate(`/feeds/${feedId}/articles/${article.id}`);
  }

  // Scroll-snap: programmatically scroll to the reader panel when an
  // article is selected, and back to the list when the back pill is tapped.
  const snapContainerRef = useRef<HTMLDivElement>(null);
  const programmaticScrollRef = useRef(false);

  /** Scroll the snap container to the reader (panel 2). */
  const scrollToReader = useCallback(() => {
    const el = snapContainerRef.current;
    if (!el) return;
    programmaticScrollRef.current = true;
    el.scrollTo({ left: el.clientWidth, behavior: "smooth" });
  }, []);

  /** Scroll the snap container back to the article list (panel 1). */
  const scrollToList = useCallback(() => {
    const el = snapContainerRef.current;
    if (!el) return;
    programmaticScrollRef.current = true;
    skipAutoSelectRef.current = true;
    el.scrollTo({ left: 0, behavior: "smooth" });
  }, []);

  // When the URL gains an articleId, scroll to the reader panel.
  useEffect(() => {
    if (!isDesktop && articleId && feedId) {
      // Small delay so the reader content renders before we scroll.
      requestAnimationFrame(() => scrollToReader());
    }
  }, [isDesktop, articleId, feedId, scrollToReader]);

  // Detect user-initiated swipe-back via scrollend. When the user swipes
  // from the reader panel back to the list, drop the articleId from the URL
  // so the back navigation is reflected in history.
  useEffect(() => {
    const el = snapContainerRef.current;
    if (!el || isDesktop) return;

    function handleScrollEnd() {
      // Ignore scrolls we triggered programmatically.
      if (programmaticScrollRef.current) {
        programmaticScrollRef.current = false;
        return;
      }
      // If scrolled back to the list panel and URL still has articleId, navigate.
      if (el!.scrollLeft < el!.clientWidth / 2 && articleId && feedId) {
        skipAutoSelectRef.current = true;
        navigate(`/feeds/${feedId}`, { replace: true });
      }
    }

    el.addEventListener("scrollend", handleScrollEnd);
    return () => el.removeEventListener("scrollend", handleScrollEnd);
  }, [isDesktop, articleId, feedId, navigate]);

  // Mobile: sidebar is offcanvas, two-panel scroll-snap for list ↔ reader
  if (!isDesktop) {
    // Explore page: no scroll-snap, single panel
    const showExplore = isExplorePage || (!feedId && feeds.length === 0);

    return (
      <SidebarProvider defaultOpen={false}>
        <SidebarKeyboardToggle />
        <AppSidebar onFeedSelect={handleFeedSelect} />
        <SidebarInset className="flex flex-col h-dvh overflow-hidden">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 z-10 bg-background">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger />
              </TooltipTrigger>
              <TooltipContent>
                Toggle Sidebar <Kbd className="ml-1">[</Kbd>
              </TooltipContent>
            </Tooltip>
            <HeaderBreadcrumbs fallback={feedId ? "Articles" : "Feeds"} />
          </header>

          {showExplore ? (
            <main role="main" className="flex-1 overflow-y-auto">
              <Suspense><ExploreCatalog onFeedAdded={handleFeedAdded} /></Suspense>
            </main>
          ) : (
            <div
              ref={snapContainerRef}
              className="flex flex-1 min-h-0 overflow-x-auto snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
            >
              {/* Panel 1: Article list — owns its own scroll for virtualization */}
              <main role="main" className="shrink-0 w-full snap-start">
                <ArticleList onArticleSelect={handleArticleSelect} />
              </main>

              {/* Panel 2: Reader */}
              <div className="shrink-0 w-full snap-start overflow-y-auto relative">
                <ReaderPanel />
                {/* Floating back pill */}
                {articleId && (
                  <Button
                    data-testid="back-pill"
                    variant="secondary"
                    size="sm"
                    className="fixed bottom-6 left-4 z-20 rounded-full shadow-md px-3 h-8"
                    onClick={() => {
                      scrollToList();
                      navigate(`/feeds/${feedId}`);
                    }}
                  >
                    <ChevronLeft className="size-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>
            </div>
          )}
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Desktop: sidebar + article list + reader pane
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <SidebarKeyboardToggle />
      <AppSidebar onFeedSelect={handleFeedSelect} />
      <SidebarInset className="overflow-hidden">
        {isExplorePage ? (
          <ScrollArea className="flex-1 min-h-0">
            <Suspense><ExploreCatalog onFeedAdded={handleFeedAdded} /></Suspense>
          </ScrollArea>
        ) : feeds.length === 0 ? (
          <ScrollArea className="flex-1 min-h-0">
            <Suspense><ExploreCatalog onFeedAdded={handleFeedAdded} /></Suspense>
          </ScrollArea>
        ) : (
          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 min-h-0"
          >
            <ResizablePanel
              defaultSize="40%"
              minSize="300px"
              className="overflow-hidden"
            >
              {/* ArticleList owns its own scroll container so the virtualizer
                  can measure and observe a single scroll element. */}
              <ArticleList onArticleSelect={handleArticleSelect} />
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel
              defaultSize="60%"
              minSize="300px"
              className="overflow-hidden"
            >
              <ScrollArea className="h-full">
                <ReaderPanel />
              </ScrollArea>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
