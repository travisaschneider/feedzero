import { Loader2 } from "lucide-react";

interface ImportProgressProps {
  currentUrl: string | null;
  currentIndex: number;
  totalCount: number;
}

export function ImportProgress({
  currentUrl,
  currentIndex,
  totalCount,
}: ImportProgressProps) {
  const progress = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0;

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>

      <div className="text-center">
        <p className="font-medium">
          Adding feed {currentIndex + 1} of {totalCount}
        </p>
        {currentUrl && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {currentUrl}
          </p>
        )}
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
