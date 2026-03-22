import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { FeedFavicon } from "@/components/feeds/feed-favicon.tsx";
import { useFeedStore } from "@/stores/feed-store.ts";
import type { FeedPack } from "@/lib/feed-packs.ts";

interface FeedPackCardProps {
  pack: FeedPack;
  onComplete?: () => void;
}

export function FeedPackCard({ pack, onComplete }: FeedPackCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const addFeed = useFeedStore((s) => s.addFeed);

  async function handleAdd() {
    setIsAdding(true);
    const toastId = toast.loading(`Adding ${pack.name}…`);

    let successCount = 0;
    for (const source of pack.sources) {
      await addFeed(source.feedUrl);
      const error = useFeedStore.getState().error;
      if (!error) successCount++;
    }

    if (successCount === pack.sources.length) {
      toast.success(`Added ${successCount} feeds`, { id: toastId });
    } else if (successCount > 0) {
      toast.success(
        `Added ${successCount} of ${pack.sources.length} feeds`,
        { id: toastId },
      );
    } else {
      toast.error("Could not add feeds", { id: toastId });
    }

    setIsAdding(false);
    setAdded(successCount > 0);
    if (successCount > 0 && onComplete) onComplete();
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-sm">{pack.name}</h3>
          <p className="text-xs text-muted-foreground">{pack.description}</p>
        </div>
        <Button
          size="sm"
          variant={added ? "secondary" : "default"}
          disabled={isAdding || added}
          onClick={handleAdd}
        >
          {isAdding ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : added ? (
            "Added"
          ) : (
            <>
              <Plus className="size-3.5 mr-1" />
              Add all
            </>
          )}
        </Button>
      </div>
      <div className="flex flex-wrap gap-3">
        {pack.sources.map((source) => (
          <div
            key={source.feedUrl}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <FeedFavicon siteUrl={source.siteUrl} className="size-3.5" />
            {source.name}
          </div>
        ))}
      </div>
    </div>
  );
}
