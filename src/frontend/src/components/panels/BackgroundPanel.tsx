import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useGetDashboardBackground } from "@/hooks/useAiChatbot";
import { ImageIcon, Palette, RotateCcw, X } from "lucide-react";

const PRESET_COLORS = [
  { label: "Default", value: "" },
  { label: "Deep Navy", value: "#0a0f1e" },
  { label: "Forest", value: "#0d1f0f" },
  { label: "Slate", value: "#111827" },
  { label: "Warm Brown", value: "#1a100a" },
  { label: "Purple Dark", value: "#0f0a1f" },
  { label: "Light", value: "#f8fafc" },
  { label: "Paper", value: "#fef9f0" },
];

interface BackgroundPanelProps {
  onClose: () => void;
}

export function BackgroundPanel({ onClose }: BackgroundPanelProps) {
  const { bg, setBackground } = useGetDashboardBackground();

  function handleReset() {
    setBackground({ bgColor: "", wallpaperUrl: "", wallpaperOpacity: 0.95 });
  }

  return (
    <div
      className="fixed top-0 left-60 z-40 h-full w-72 bg-sidebar border-r border-sidebar-border shadow-xl flex flex-col panel-slide-in"
      data-ocid="background-panel"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-accent" />
          <span className="font-display font-semibold text-sm text-sidebar-foreground">
            Background
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-sidebar-foreground/50"
          onClick={onClose}
          aria-label="Close panel"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Color presets */}
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
            Background Color
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setBackground({ bgColor: c.value })}
                title={c.label}
                className="flex flex-col items-center gap-1"
                data-ocid={`bg-color-preset-${c.label}`}
              >
                <span
                  className="size-9 rounded-lg border-2 transition-all"
                  style={{
                    background: c.value || "oklch(var(--background))",
                    borderColor:
                      bg.bgColor === c.value
                        ? "oklch(var(--accent))"
                        : "oklch(var(--border))",
                  }}
                />
                <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                  {c.label}
                </span>
              </button>
            ))}
          </div>
          {/* Custom color picker */}
          <div className="mt-3 flex items-center gap-2">
            <Label className="text-xs text-muted-foreground shrink-0">
              Custom
            </Label>
            <input
              type="color"
              value={bg.bgColor || "#0d1117"}
              onChange={(e) => setBackground({ bgColor: e.target.value })}
              className="h-7 w-12 rounded cursor-pointer border border-border bg-transparent"
              data-ocid="bg-color-picker"
            />
            <span className="text-xs text-muted-foreground font-mono">
              {bg.bgColor || "default"}
            </span>
          </div>
        </div>

        {/* Wallpaper URL */}
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
            Wallpaper URL
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://..."
              value={bg.wallpaperUrl}
              onChange={(e) => setBackground({ wallpaperUrl: e.target.value })}
              className="h-8 text-xs"
              data-ocid="bg-wallpaper-url"
            />
            <Button
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Browse images"
            >
              <ImageIcon className="size-3.5" />
            </Button>
          </div>
          {bg.wallpaperUrl && (
            <div
              className="mt-2 h-20 rounded-lg overflow-hidden border border-border"
              style={{
                backgroundImage: `url(${bg.wallpaperUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
        </div>

        {/* Opacity */}
        {bg.wallpaperUrl && (
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
              Overlay Opacity: {Math.round(bg.wallpaperOpacity * 100)}%
            </Label>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[Math.round(bg.wallpaperOpacity * 100)]}
              onValueChange={([v]) =>
                setBackground({ wallpaperOpacity: v / 100 })
              }
              data-ocid="bg-opacity-slider"
            />
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-sidebar-border shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="w-full gap-2"
          data-ocid="bg-reset-btn"
        >
          <RotateCcw className="size-3.5" />
          Reset to Default
        </Button>
      </div>
    </div>
  );
}
