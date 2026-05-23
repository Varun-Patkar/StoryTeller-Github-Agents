import Link from "next/link";
import type { Book } from "@/lib/books";
import { BookOpen } from "lucide-react";
import { ReadingBadge } from "@/components/reading-badge";

export function BookCard({ book }: { book: Book }) {
  const totalChapters = parseInt(book.config.totalChapters) || 0;
  const genres = book.config.genre
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  return (
    <Link
      href={`/book/${book.slug}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 max-w-[300px]"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] overflow-hidden">
        {/* Background — separate divs for light/dark so gradients don't bleed */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:hidden" />
        <div className="absolute inset-0 hidden dark:block bg-neutral-800" />

        {book.hasCover ? (
          <img
            src={`/api/books/${book.slug}/cover`}
            alt={book.config.title || book.slug}
            className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="relative flex flex-col items-center justify-center h-full p-6 text-center">
            <BookOpen className="w-12 h-12 text-amber-400/70 dark:text-neutral-600 mb-3" />
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-400 leading-tight">
              {book.config.title || book.slug}
            </p>
          </div>
        )}

        {/* Status badge */}
        {book.config.status && (
          <span
            className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm ${
              book.config.status === "Complete"
                ? "bg-emerald-500/90 text-white"
                : "bg-amber-500/90 text-white"
            }`}
          >
            {book.config.status}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-base leading-tight line-clamp-2">
          {book.config.title || book.slug}
        </h3>

        {book.config.author && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            by {book.config.author}
          </p>
        )}

        {book.config.fandom && book.config.fandom !== "N/A" && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {book.config.fandom}
          </p>
        )}

        {/* Genre pills */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {genres.map((genre) => (
              <span
                key={genre}
                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Chapter count + reading progress */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            {book.chapterCount}
            {totalChapters > 0 ? ` / ${totalChapters}` : ""} chapter
            {book.chapterCount !== 1 ? "s" : ""}
          </p>
          <ReadingBadge slug={book.slug} />
        </div>
      </div>
    </Link>
  );
}
