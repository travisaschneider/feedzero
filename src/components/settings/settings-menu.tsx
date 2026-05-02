import { useState, useEffect } from "react";
import {
  Cloud,
  Keyboard,
  Loader2,
  MessageSquare,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useSyncStore } from "@/stores/sync-store.ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { KeyboardShortcutsDialog } from "@/components/layout/keyboard-shortcuts-dialog.tsx";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog.tsx";
import { AutoOrganizeDialog } from "@/components/folders/auto-organize-dialog.tsx";

interface SettingsMenuProps {
  /** The DropdownMenuTrigger child — typically a button or SidebarMenuButton. */
  trigger: React.ReactNode;
  /** Whether the user has any feeds (gates Auto-organize and Cloud-sync enable). */
  hasFeeds: boolean;
  /** Called when the user picks "What's new" — implementation differs by host. */
  onWhatsNew: () => void;
  /** DropdownMenuContent positioning — sidebar uses "top", drawer uses "top" too. */
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  contentClassName?: string;
}

/**
 * Shared settings menu used by both the desktop sidebar footer and the mobile
 * bottom drawer. Owns the dialogs (keyboard shortcuts, feedback, auto-organize)
 * and listens for the `feedzero:open-settings` event so Cmd/Ctrl+, opens the menu
 * regardless of which surface is hosting it.
 */
export function SettingsMenu({
  trigger,
  hasFeeds,
  onWhatsNew,
  side = "top",
  align = "end",
  contentClassName,
}: SettingsMenuProps) {
  const syncStatus = useSyncStore((s) => s.status);
  const setSyncDialogOpen = useSyncStore((s) => s.setDialogOpen);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [autoOrganizeOpen, setAutoOrganizeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isSyncOn = syncStatus === "synced" || syncStatus === "syncing";
  const isSyncing = syncStatus === "syncing";
  const canSync = hasFeeds;

  useEffect(() => {
    const handler = () => setMenuOpen(true);
    document.addEventListener("feedzero:open-settings", handler);
    return () =>
      document.removeEventListener("feedzero:open-settings", handler);
  }, []);

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          className={contentClassName ?? "min-w-56 rounded-lg"}
          side={side}
          align={align}
          sideOffset={4}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuItem
                disabled={!canSync && !isSyncOn}
                onSelect={(e) => {
                  e.preventDefault();
                  if (canSync || isSyncOn) setSyncDialogOpen(true);
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  {isSyncing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Cloud className="size-4" />
                  )}
                  <span>Cloud sync</span>
                </div>
                <Switch
                  size="sm"
                  checked={isSyncOn}
                  disabled={!canSync && !isSyncOn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canSync || isSyncOn) setSyncDialogOpen(true);
                  }}
                />
              </DropdownMenuItem>
            </TooltipTrigger>
            {!canSync && !isSyncOn && (
              <TooltipContent side="left">
                Add a feed first to enable sync
              </TooltipContent>
            )}
          </Tooltip>
          {hasFeeds && (
            <DropdownMenuItem onSelect={() => setAutoOrganizeOpen(true)}>
              <Wand2 className="size-4" />
              <span>Auto-organize feeds</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setShortcutsOpen(true)}>
            <Keyboard className="size-4" />
            <span>Keyboard shortcuts</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setFeedbackOpen(true)}>
            <MessageSquare className="size-4" />
            <span>Send feedback</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onWhatsNew}>
            <Sparkles className="size-4" />
            <span>What&apos;s new</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <AutoOrganizeDialog open={autoOrganizeOpen} onOpenChange={setAutoOrganizeOpen} />
    </>
  );
}
