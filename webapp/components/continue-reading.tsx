"use client";

import Link from "next/link";
import { useReadingProgress } from "@/lib/reading-progress";
import { BookOpen } from "lucide-react";

export function ContinueReading({
  slug,
  totalWrittenChapters,
}: {
  slug: string;
  totalWrittenChapters: number;
}) {
  const { progress, loaded } = useReadingProgress(slug);

  if (!loaded) {
    return (
      <div className="h-[52px] rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
    );
  }

  if (!progress || totalWrittenChapters === 0) {
    return (
      <Link
        href={`/book/${slug}/chapter/1`}
        className="block text-center text-sm font-medium px-6 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
      >
        Start Reading
      </Link>
    );
  }

  const chapterNum = Math.min(progress.chapter, totalWrittenChapters);

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Link
        href={`/book/${slug}/chapter/${chapterNum}`}
        className="flex-1 flex items-center justify-center gap-2 text-sm font-medium px-6 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
      >
        <BookOpen className="w-4 h-4" />
        Continue Chapter {chapterNum}
        {progress.scrollPercent > 0 && progress.scrollPercent < 100 && (
          <span className="opacity-60">({progress.scrollPercent}%)</span>
        )}
      </Link>
      {chapterNum > 1 && (
        <Link
          href={`/book/${slug}/chapter/1`}
          className="text-center text-sm font-medium px-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Start Over
        </Link>
      )}
    </div>
  );
}
