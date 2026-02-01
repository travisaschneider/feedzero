import { useState } from "react";
import { useFeedStore } from "@/stores/feed-store.ts";

export function AddFeedForm() {
  const [url, setUrl] = useState("");
  const addFeed = useFeedStore((s) => s.addFeed);
  const isLoading = useFeedStore((s) => s.isLoading);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    await addFeed(trimmed);
    setUrl("");
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Add feed" className="flex gap-xs p-sm">
      <label className="flex-1">
        <span className="visually-hidden">Feed URL</span>
        <input
          type="text"
          inputMode="url"
          placeholder="Enter feed URL..."
          required
          aria-label="Feed URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
      </label>
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
