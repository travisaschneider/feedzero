import type { Feed } from "@/types/index.ts";

interface FeedItemProps {
  feed: Feed;
  isSelected: boolean;
  onSelect: (feedId: string) => void;
  onRemove: (feedId: string) => void;
}

export function FeedItem({ feed, isSelected, onSelect, onRemove }: FeedItemProps) {
  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(`Remove "${feed.title}"?`)) {
      onRemove(feed.id);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(feed.id);
    }
  }

  return (
    <li
      role="option"
      tabIndex={0}
      aria-selected={isSelected}
      data-id={feed.id}
      onClick={() => onSelect(feed.id)}
      onKeyDown={handleKeyDown}
      className="flex items-center justify-between px-sm py-xs cursor-pointer hover:bg-bg-hover aria-selected:bg-bg-active aria-selected:font-semibold group"
    >
      <span className="truncate">{feed.title}</span>
      <button
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-danger border-none bg-transparent px-xs"
        aria-label={`Remove ${feed.title}`}
        onClick={handleRemove}
      >
        &times;
      </button>
    </li>
  );
}
