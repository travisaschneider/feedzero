import { cn } from "@/lib/utils";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

/** Styled keyboard shortcut badge. */
export function Kbd({ children, className, ...props }: KbdProps) {
  return (
    <kbd
      aria-hidden="true"
      className={cn(
        "pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border border-border bg-blue-50 dark:bg-blue-950 px-2 font-mono text-xs font-medium text-blue-700 dark:text-blue-300",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
