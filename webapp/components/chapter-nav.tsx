import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ChapterNav({
  slug,
  currentChapter,
  totalChapters,
}: {
  slug: string;
  currentChapter: number;
  totalChapters: number;
}) {
  const hasPrev = currentChapter > 1;
  const hasNext = currentChapter < totalChapters;

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

      {hasNext ? (
        <Link
          href={`/book/${slug}/chapter/${currentChapter + 1}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <span className="hidden sm:inline">Next Chapter</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
