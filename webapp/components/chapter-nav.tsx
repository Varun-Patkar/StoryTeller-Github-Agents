"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { useChatState } from "@/components/chat-provider";

export function ChapterNav({
  slug,
  currentChapter,
  totalChapters,
  writtenChapters,
  bookTitle,
}: {
  slug: string;
  currentChapter: number;
  totalChapters: number;
  writtenChapters: number;
  bookTitle: string;
}) {
  const { openWithPrompt } = useChatState();
  const hasPrev = currentChapter > 1;
  const hasNextWritten = currentChapter < writtenChapters;
  const isLastWritten = currentChapter === writtenChapters;
  const hasMorePlanned = writtenChapters < totalChapters;

  return (
    <div className="flex items-center justify-between py-8 gap-4">
      {hasPrev ? (
        <Link
          href={`/book/${slug}/chapter/${currentChapter - 1}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous Chapter</span>
          <span className="sm:hidden">Prev</span>
        </Link>
      ) : (
        <div />
      )}

      <span className="text-xs text-neutral-400">
        {currentChapter} / {totalChapters}
      </span>

      {hasNextWritten ? (
        <Link
          href={`/book/${slug}/chapter/${currentChapter + 1}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <span className="hidden sm:inline">Next Chapter</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : isLastWritten && hasMorePlanned ? (
        <button
          onClick={() =>
            openWithPrompt(
              `Write the next chapter for "${bookTitle}" (book slug: ${slug}). Read the config, plan, and summary first, then create and write the chapter.`
            )
          }
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
        >
          <PenLine className="w-4 h-4" />
          <span className="hidden sm:inline">Generate Next Chapter</span>
          <span className="sm:hidden">Generate</span>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
