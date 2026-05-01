import { Layers } from "lucide-react";
import { ALL_FEEDS_ID } from "@/utils/constants.ts";
import { useFeedStore } from "@/stores/feed-store.ts";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet.tsx";
import {
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar.tsx";
import { SidebarFeedList } from "@/components/sidebar/sidebar-feed-list.tsx";

interface FeedSwitcherSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeedSelect: (feedId: string) => void;
}

export function FeedSwitcherSheet({ open, onOpenChange, onFeedSelect }: FeedSwitcherSheetProps) {
  const selectedFeedId = useFeedStore((s) => s.selectedFeedId);

  function handleSelect(feedId: string) {
    onFeedSelect(feedId);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false}>
        <SheetHeader className="sr-only">
          <SheetTitle>Feeds</SheetTitle>
          <SheetDescription>Select a feed to view its articles.</SheetDescription>
        </SheetHeader>
        {/* SidebarProvider required: SidebarMenuButton calls useSidebar() */}
        <SidebarProvider defaultOpen={false}>
          <div className="w-full max-h-[70dvh] overflow-y-auto py-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={selectedFeedId === ALL_FEEDS_ID}
                  onClick={() => handleSelect(ALL_FEEDS_ID)}
                >
                  <Layers className="size-4" />
                  <span>All items</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarSeparator className="mx-0 my-1" />
              <SidebarFeedList onFeedSelect={handleSelect} />
            </SidebarMenu>
          </div>
        </SidebarProvider>
      </SheetContent>
    </Sheet>
  );
}
