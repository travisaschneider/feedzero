import { useEffect, useCallback } from "react";

/**
 * Keyboard navigation hook for j/k/Enter/Escape feed reader navigation.
 * Replaces the old Shadow DOM-traversing keyboard-nav.js.
 */
export function useKeyboardNav() {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;

    // Skip when user is typing in an input
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    switch (e.key) {
      case "j":
        moveFocus(1);
        break;
      case "k":
        moveFocus(-1);
        break;
      case "Enter":
        activateFocused();
        break;
      case "Escape":
        goBack();
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

/** Find the listbox that contains the currently focused element, or the first listbox. */
function getActiveListbox(): HTMLElement | null {
  const focused = document.activeElement as HTMLElement | null;
  const listboxes = document.querySelectorAll<HTMLElement>('[role="listbox"]');

  // If focus is inside a listbox, use that one
  for (const listbox of listboxes) {
    if (listbox.contains(focused)) return listbox;
  }

  // Otherwise use the first listbox
  return listboxes[0] || null;
}

function moveFocus(direction: 1 | -1) {
  const listbox = getActiveListbox();
  if (!listbox) return;

  const items = Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'));
  if (items.length === 0) return;

  const focused = document.activeElement as HTMLElement;
  const currentIndex = items.indexOf(focused);
  const nextIndex = currentIndex === -1
    ? (direction === 1 ? 0 : items.length - 1)
    : Math.max(0, Math.min(items.length - 1, currentIndex + direction));

  items[nextIndex].focus();
}

function activateFocused() {
  const focused = document.activeElement as HTMLElement | null;
  if (focused?.getAttribute("role") === "option") {
    focused.click();
  }
}

function goBack() {
  // Move focus to the first listbox (feed list)
  const firstListbox = document.querySelector<HTMLElement>('[role="listbox"]');
  if (!firstListbox) return;
  const firstItem = firstListbox.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')
    || firstListbox.querySelector<HTMLElement>('[role="option"]');
  firstItem?.focus();
}
