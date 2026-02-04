import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useFeedStore } from "@/stores/feed-store.ts";
import { Pending } from "@/components/ui/pending.tsx";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group.tsx";

interface AddFeedFormProps {
  onAdded: () => void;
  onCancel?: () => void;
  onFeedSelect?: (feedId: string) => void;
}

export function AddFeedForm({
  onAdded,
  onCancel,
  onFeedSelect,
}: AddFeedFormProps) {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addFeed = useFeedStore((s) => s.addFeed);
  const isLoading = useFeedStore((s) => s.isLoading);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    const toastId = toast.loading("Discovering feed…");
    await addFeed(trimmed);
    setUrl("");

    const error = useFeedStore.getState().error;
    if (error) {
      toast.error(error, { id: toastId });
    } else {
      toast.success("Feed added", { id: toastId });
      const newFeedId = useFeedStore.getState().selectedFeedId;
      if (newFeedId && onFeedSelect) onFeedSelect(newFeedId);
      onAdded();
    }
  }

  if (isLoading) {
    return (
      <form aria-label="Add feed" className="p-2">
        <Pending isPending>
          <InputGroupButton
            type="button"
            variant="secondary"
            size="sm"
            className="w-full font-mono"
          >
            Adding feed…
          </InputGroupButton>
        </Pending>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Add feed" className="p-2">
      <InputGroup>
        <InputGroupInput
          ref={inputRef}
          type="text"
          inputMode="url"
          placeholder="Feed or site URL…"
          required
          aria-label="Feed URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel?.();
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="submit"
            variant="secondary"
            className="font-mono"
          >
            Add
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
