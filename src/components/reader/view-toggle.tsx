interface ViewToggleProps {
  modes: string[];
  activeMode: string;
  onModeChange: (mode: "feed" | "extracted") => void;
}

export function ViewToggle({ modes, activeMode, onModeChange }: ViewToggleProps) {
  if (modes.length <= 1) return null;

  return (
    <div className="flex gap-xs mb-md">
      {modes.map((mode) => (
        <button
          key={mode}
          aria-pressed={mode === activeMode}
          onClick={() => onModeChange(mode as "feed" | "extracted")}
          className="text-sm aria-pressed:bg-bg-active aria-pressed:font-semibold"
        >
          {mode === "feed" ? "Feed" : "Extracted"}
        </button>
      ))}
    </div>
  );
}
