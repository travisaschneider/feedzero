import { useState, type ReactNode } from "react";
import { FolderPlus } from "lucide-react";
import { useFeedStore } from "@/stores/feed-store.ts";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar.tsx";

interface NewFolderInputProps {
  trailing?: ReactNode;
}

export function NewFolderInput({ trailing }: NewFolderInputProps = {}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const createFolder = useFeedStore((s) => s.createFolder);

  if (creating) {
    return (
      <SidebarMenuItem>
        <form
          className="flex items-center gap-2 px-2 py-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) createFolder(name.trim());
            setCreating(false);
            setName("");
          }}
        >
          <FolderPlus className="size-4 text-muted-foreground" />
          <input
            autoFocus
            placeholder="Folder name"
            className="flex-1 bg-transparent text-sm outline-none border-b border-primary min-w-0"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => { setCreating(false); setName(""); }}
            onKeyDown={(e) => { if (e.key === "Escape") { setCreating(false); setName(""); } }}
          />
        </form>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem className="flex items-center">
      <SidebarMenuButton className="text-muted-foreground flex-1" onClick={() => setCreating(true)}>
        <FolderPlus className="size-4" />
        <span>New folder</span>
      </SidebarMenuButton>
      {trailing && <div className="shrink-0 pr-1">{trailing}</div>}
    </SidebarMenuItem>
  );
}
