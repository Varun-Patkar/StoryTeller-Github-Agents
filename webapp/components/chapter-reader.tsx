"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChapterNav } from "@/components/chapter-nav";
import {
  ReadingSettingsPanel,
  SettingsToggle,
  useReaderSettings,
  getReaderStyles,
} from "@/components/reading-settings";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { setProgress } from "@/lib/reading-progress";

interface ChapterData {
  meta: { number: number; title: string };
  content: string;
  totalChapters: number;
  bookTitle: string;
  slug: string;
}

export default function ChapterReader({ data }: { data: ChapterData }) {
  const { settings, updateSettings, loaded } = useReaderSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);

  // Swipe navigation for mobile
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;

      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;

      // Only horizontal swipes (not scrolling)
      if (Math.abs(dx) > 80 && Math.abs(dy) < 50) {
        if (dx > 0 && data.meta.number > 1) {
          // Swipe right → previous
          window.location.href = `/book/${data.slug}/chapter/${data.meta.number - 1}`;
        } else if (dx < 0 && data.meta.number < data.totalChapters) {
          // Swipe left → next
          window.location.href = `/book/${data.slug}/chapter/${data.meta.number + 1}`;
        }
      }
      touchStart.current = null;
    },
    [data.slug, data.meta.number, data.totalChapters]
  );

  // Scroll to top on chapter change & save progress
  useEffect(() => {
    window.scrollTo(0, 0);
    setProgress(data.slug, data.meta.number, 0);
  }, [data.meta.number, data.slug]);

  // Track scroll progress
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
        setProgress(data.slug, data.meta.number, percent);
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data.slug, data.meta.number]);

  if (!loaded) return null;

  const styles = getReaderStyles(settings);

  // Strip the first heading line (chapter title) from content since we show it separately
  const contentWithoutTitle = data.content.replace(
    /^#\s*Chapter\s*\d+:.*\n*/,
    ""
  );

  return (
    <div
      className="min-h-screen transition-colors duration-200"
      style={{
        backgroundColor: styles.backgroundColor,
        color: styles.color,
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{
          borderColor: `${styles.color}15`,
          backgroundColor: `${styles.backgroundColor}cc`,
        }}
      >
        <div className="w-full px-4 sm:px-8 h-12 flex items-center justify-between">
          <Link
            href={`/book/${data.slug}`}
            className="flex items-center gap-2 text-sm opacity-60 hover:opacity-100 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline truncate max-w-[200px]">
              {data.bookTitle}
            </span>
            <span className="sm:hidden">Back</span>
          </Link>

          <span className="text-xs opacity-40">
            Chapter {data.meta.number} of {data.totalChapters}
          </span>

          <SettingsToggle onClick={() => setSettingsOpen(!settingsOpen)} />
        </div>
      </div>

      {/* Settings panel */}
      <ReadingSettingsPanel
        settings={settings}
        onUpdate={updateSettings}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Reader content */}
      <div
        ref={readerRef}
        className={`mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-12 w-full ${styles.maxWidthClass}`}
        style={{
          fontFamily: styles.fontFamily,
          fontSize: styles.fontSize,
          lineHeight: styles.lineHeight,
        }}
      >
        {/* Chapter title */}
        <h1
          className="font-bold mb-8 sm:mb-12 text-center"
          style={{ fontSize: `${settings.fontSize * 1.5}px` }}
        >
          Chapter {data.meta.number}: {data.meta.title}
        </h1>

        {/* Prose */}
        <div className="reader-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {contentWithoutTitle}
          </ReactMarkdown>
        </div>

        {/* Bottom nav */}
        <ChapterNav
          slug={data.slug}
          currentChapter={data.meta.number}
          totalChapters={data.totalChapters}
        />
      </div>
    </div>
  );
}
