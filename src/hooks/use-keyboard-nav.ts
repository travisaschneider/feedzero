import { useEffect, useCallback } from "react";
import { useArticleStore } from "@/stores/article-store.ts";
import { useFeedStore } from "@/stores/feed-store.ts";
import { useExtractionStore } from "@/stores/extraction-store.ts";

/**
 * Keyboard navigation hook for feed reader shortcuts.
 *
 * Article nav:  j/k (next/prev — directly opens article)
 * Feed nav:     u/i (next/prev feed)
 * Actions:      o (open original), e (toggle view), n (explore/add feed)
 */
export function useKeyboardNav() {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd/Ctrl+, opens settings (works even in inputs)
    if (e.key === "," && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent("feedzero:open-settings"));
      return;
    }

    const target = e.target as HTMLElement;

    // Skip when user is typing in an input or navigating a menu/dialog
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable ||
      (target.closest &&
        target.closest('[role="menu"], [role="dialog"], [role="alertdialog"]'))
    ) {
      return;
    }

    switch (e.key) {
      case "j":
      case "ArrowDown":
        moveArticle(1);
        break;
      case "k":
      case "ArrowUp":
        moveArticle(-1);
        break;
      case "u":
        moveFeedFocus(1);
        break;
      case "i":
        moveFeedFocus(-1);
        break;
      case "o":
        openOriginal();
        break;
      case "h":
        toggleView();
        break;
      case "n":
        navigateToExplore();
        break;
      case "[":
        toggleSidebar();
        break;
      case " ":
        scrollReader(e.shiftKey ? -1 : 1);
        break;
      case "r":
        refreshAllFeeds();
        break;
      default:
        return;
    }

    e.preventDefault();
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/** Clamp next index within bounds, defaulting to first or last when no current index. */
function clampedIndex(
  currentIndex: number,
  direction: 1 | -1,
  length: number,
): number {
  if (currentIndex === -1) {
    return direction === 1 ? 0 : length - 1;
  }
  return Math.max(0, Math.min(length - 1, currentIndex + direction));
}

function moveArticle(direction: 1 | -1) {
  const listbox = document.querySelector<HTMLElement>('[role="listbox"]');
  if (!listbox) return;

  const items = Array.from(
    listbox.querySelectorAll<HTMLElement>('[role="option"]'),
  );
  if (items.length === 0) return;

  const selectedIndex = items.findIndex(
    (item) => item.getAttribute("aria-selected") === "true",
  );
  const nextItem = items[clampedIndex(selectedIndex, direction, items.length)];

  nextItem.click();

  // Scroll into view after selection
  // Use setTimeout to ensure click has processed and DOM has updated
  setTimeout(() => {
    nextItem.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, 0);
}

function moveFeedFocus(direction: 1 | -1) {
  const buttons = Array.from(
    document.querySelectorAll<HTMLElement>('[data-sidebar="menu-button"]'),
  );
  if (buttons.length === 0) return;

  const activeIndex = buttons.findIndex(
    (btn) => btn.getAttribute("data-active") === "true",
  );
  buttons[clampedIndex(activeIndex, direction, buttons.length)].click();
}

function openOriginal() {
  const { selectedArticle } = useArticleStore.getState();
  if (selectedArticle?.link) {
    window.open(selectedArticle.link, "_blank", "noopener,noreferrer");
  }
}

function toggleView() {
  const { toggleViewMode } = useExtractionStore.getState();
  const { selectedArticle } = useArticleStore.getState();
  toggleViewMode(selectedArticle?.link);
}

/** Scroll the reader panel by one viewport height. Shift+Space scrolls up. */
function scrollReader(direction: 1 | -1) {
  // Find the reader's scroll container (the ScrollArea viewport wrapping the reader)
  const reader = document.querySelector("article")?.closest(
    '[data-radix-scroll-area-viewport]',
  ) as HTMLElement | null;
  if (reader) {
    reader.scrollBy({ top: direction * reader.clientHeight * 0.8, behavior: "smooth" });
  }
}

function navigateToExplore() {
  document.dispatchEvent(new CustomEvent("feedzero:navigate-explore"));
}

function toggleSidebar() {
  document.dispatchEvent(new CustomEvent("feedzero:toggle-sidebar"));
}

function refreshAllFeeds() {
  useFeedStore.getState().refreshAll();
}
