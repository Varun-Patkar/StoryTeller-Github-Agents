"use client";

import { useEffect, useState, useCallback } from "react";
import { Settings, X, Minus, Plus } from "lucide-react";

export interface ReaderSettings {
  fontFamily: "serif" | "sans" | "mono";
  fontSize: number;
  lineHeight: number;
  maxWidth: "narrow" | "medium" | "wide";
  readerTheme: "white" | "cream" | "sepia" | "dark" | "black";
}

const DEFAULTS: ReaderSettings = {
  fontFamily: "serif",
  fontSize: 18,
  lineHeight: 1.8,
  maxWidth: "wide",
  readerTheme: "white",
};

const STORAGE_KEY = "storyteller-reader-settings";

const FONT_MAP = {
  serif: "'Georgia', 'Times New Roman', serif",
  sans: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
};

const WIDTH_MAP = {
  narrow: "max-w-3xl",
  medium: "max-w-5xl",
  wide: "max-w-[80vw]",
};

const THEME_MAP = {
  white: { bg: "#ffffff", text: "#1a1a1a" },
  cream: { bg: "#faf8f1", text: "#1a1a1a" },
  sepia: { bg: "#f4ecd8", text: "#5b4636" },
  dark: { bg: "#1a1a1a", text: "#d4d4d4" },
  black: { bg: "#000000", text: "#e5e5e5" },
};

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setSettings({ ...DEFAULTS, ...JSON.parse(saved) });
    } catch {}
    setLoaded(true);
  }, []);

  const updateSettings = useCallback((partial: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, updateSettings, loaded };
}

export function getReaderStyles(settings: ReaderSettings) {
  const theme = THEME_MAP[settings.readerTheme];
  return {
    fontFamily: FONT_MAP[settings.fontFamily],
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    backgroundColor: theme.bg,
    color: theme.text,
    maxWidthClass: WIDTH_MAP[settings.maxWidth],
  };
}

export function ReadingSettingsPanel({
  settings,
  onUpdate,
  open,
  onClose,
}: {
  settings: ReaderSettings;
  onUpdate: (s: Partial<ReaderSettings>) => void;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/30 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-16 md:right-4 md:left-auto md:w-80 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-t-2xl md:rounded-2xl shadow-2xl p-6 space-y-5 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Reading Settings</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Font Family */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">
            Font
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["serif", "sans", "mono"] as const).map((f) => (
              <button
                key={f}
                onClick={() => onUpdate({ fontFamily: f })}
                className={`text-xs py-2 rounded-lg border transition-colors ${
                  settings.fontFamily === f
                    ? "border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
                style={{ fontFamily: FONT_MAP[f] }}
              >
                {f === "serif" ? "Serif" : f === "sans" ? "Sans" : "Mono"}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">
            Size — {settings.fontSize}px
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                onUpdate({ fontSize: Math.max(14, settings.fontSize - 1) })
              }
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={14}
              max={28}
              value={settings.fontSize}
              onChange={(e) =>
                onUpdate({ fontSize: parseInt(e.target.value) })
              }
              className="flex-1 accent-neutral-900 dark:accent-white"
            />
            <button
              onClick={() =>
                onUpdate({ fontSize: Math.min(28, settings.fontSize + 1) })
              }
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Line Height */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">
            Line Spacing — {settings.lineHeight.toFixed(1)}
          </label>
          <input
            type="range"
            min={1.2}
            max={2.5}
            step={0.1}
            value={settings.lineHeight}
            onChange={(e) =>
              onUpdate({ lineHeight: parseFloat(e.target.value) })
            }
            className="w-full accent-neutral-900 dark:accent-white"
          />
        </div>

        {/* Max Width */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">
            Column Width
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["narrow", "medium", "wide"] as const).map((w) => (
              <button
                key={w}
                onClick={() => onUpdate({ maxWidth: w })}
                className={`text-xs py-2 rounded-lg border transition-colors capitalize ${
                  settings.maxWidth === w
                    ? "border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                    : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Reader Theme */}
        <div>
          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">
            Reader Theme
          </label>
          <div className="flex gap-2">
            {(
              Object.keys(THEME_MAP) as Array<keyof typeof THEME_MAP>
            ).map((t) => (
              <button
                key={t}
                onClick={() => onUpdate({ readerTheme: t })}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  settings.readerTheme === t
                    ? "border-neutral-900 dark:border-white scale-110"
                    : "border-neutral-300 dark:border-neutral-600"
                }`}
                style={{ backgroundColor: THEME_MAP[t].bg }}
                title={t}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function SettingsToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      aria-label="Reading settings"
    >
      <Settings className="w-5 h-5" />
    </button>
  );
}
