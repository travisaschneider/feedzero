import { useState, useMemo, useEffect } from "react";
import { Wand2, X } from "lucide-react";
import { useFeedStore } from "@/stores/feed-store";
import { LOCAL_STORAGE } from "@/utils/constants";
import { AutoOrganizeDialog } from "./auto-organize-dialog";

const FEEDS_THRESHOLD = 10;
/** Re-show the pill after this many new unfiled feeds have been added since dismiss. */
const REAPPEAR_GAP = 5;

/**
 * Discoverable entry point for the auto-organize flow.
 *
 * Renders at the bottom of the feed list when (a) unfiled feeds exceed the
 * threshold and (b) the user has not dismissed it (or has added enough new
 * feeds since the last dismissal). Violet color signals the AI/magic nature
 * of the action without competing with the nav chrome.
 */
export function AutoOrganizePill() {
  const feeds = useFeedStore((s) => s.feeds);
  const [open, setOpen] = useState(false);

  const unfiledCount = useMemo(
    () => feeds.filter((f) => !f.folderId).length,
    [feeds],
  );

  const [dismissedAtCount, setDismissedAtCount] = useState<number | null>(
    () => {
      try {
        const v = localStorage.getItem(LOCAL_STORAGE.AUTO_ORGANIZE_DISMISSED_COUNT);
        return v !== null ? parseInt(v, 10) : null;
      } catch {
        return null;
      }
    },
  );

  // Clear dismiss when the user has organized feeds down below the dismissed count —
  // they've done the work, so the next time they accumulate many unfiled feeds
  // the pill should appear fresh.
  useEffect(() => {
    if (dismissedAtCount !== null && unfiledCount < dismissedAtCount) {
      try {
        localStorage.removeItem(LOCAL_STORAGE.AUTO_ORGANIZE_DISMISSED_COUNT);
      } catch { /* ignore */ }
      setDismissedAtCount(null);
    }
  }, [unfiledCount, dismissedAtCount]);

  const visible = useMemo(() => {
    if (unfiledCount <= FEEDS_THRESHOLD) return false;
    if (dismissedAtCount === null) return true;
    return unfiledCount >= dismissedAtCount + REAPPEAR_GAP;
  }, [unfiledCount, dismissedAtCount]);

  function handleDismiss() {
    try {
      localStorage.setItem(LOCAL_STORAGE.AUTO_ORGANIZE_DISMISSED_COUNT, String(unfiledCount));
    } catch { /* ignore */ }
    setDismissedAtCount(unfiledCount);
  }

  if (!visible) return null;

  return (
    <>
      <div
        data-testid="auto-organize-pill"
        className="flex items-center gap-1 mx-1 mb-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs h-8 px-2"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 flex-1 min-w-0 hover:opacity-80"
        >
          <Wand2 className="size-3.5 shrink-0" />
          <span className="truncate font-medium">Auto-organize feeds</span>
        </button>
        <button
          type="button"
          aria-label="Dismiss auto-organize suggestion"
          onClick={handleDismiss}
          className="shrink-0 ml-0.5 hover:opacity-80"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <AutoOrganizeDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
