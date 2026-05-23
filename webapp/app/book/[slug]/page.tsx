import { getBook, getChapters } from "@/lib/books";
import { CopyButton } from "@/components/copy-button";
import { CoverUpload } from "@/components/cover-upload";
import { ContinueReading } from "@/components/continue-reading";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Eye,
  Feather,
  Layers,
  Palette,
  Tag,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) notFound();

  const chapters = await getChapters(slug);
  const { config } = book;
  const totalChapters = parseInt(config.totalChapters) || chapters.length;

  const metaItems = [
    { icon: Tag, label: "Genre", value: config.genre },
    { icon: Layers, label: "Fandom", value: config.fandom !== "N/A" ? config.fandom : null },
    { icon: Feather, label: "Themes", value: config.themes },
    { icon: Palette, label: "Tone", value: config.tone },
    { icon: Eye, label: "POV", value: config.pov },
    { icon: Clock, label: "Pacing", value: config.pacing },
  ].filter((m) => m.value);

  return (
    <div className="w-full lg:w-[80vw] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Library
      </Link>

      {/* Hero */}
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 mb-10">
        {/* Cover */}
        <div className="w-full sm:w-48 shrink-0">
          <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 shadow-lg">
            {book.hasCover ? (
              <img
                src={`/api/books/${slug}/cover`}
                alt={config.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <BookOpen className="w-10 h-10 text-neutral-400 mb-2" />
                <p className="text-xs text-neutral-500">No cover</p>
              </div>
            )}
          </div>
          <div className="mt-3">
            <CoverUpload slug={slug} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
            {config.title || slug}
          </h1>

          {config.author && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
              by {config.author}
            </p>
          )}

          {config.status && (
            <span
              className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-4 ${
                config.status === "Complete"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              {config.status} — {chapters.length} / {totalChapters} chapters
            </span>
          )}

          {config.synopsis && (
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
              {config.synopsis}
            </p>
          )}

          {/* Meta grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metaItems.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-2.5 text-sm"
              >
                <item.icon className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-neutral-500 dark:text-neutral-500 text-xs">
                    {item.label}
                  </span>
                  <p className="text-neutral-800 dark:text-neutral-200">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cover Prompt */}
      {config.coverPrompt && (
        <section className="mb-10">
          <details open={!book.hasCover || undefined}>
            <summary className="flex items-center justify-between cursor-pointer mb-3 list-none [&::-webkit-details-marker]:hidden">
              <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Cover Image Prompt
              </h2>
              <CopyButton text={config.coverPrompt} />
            </summary>
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-mono">
              {config.coverPrompt}
            </div>
          </details>
        </section>
      )}

      {/* Chapters */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
          Chapters — {chapters.length} / {totalChapters} written
        </h2>

        {chapters.length === 0 ? (
          <p className="text-neutral-400 text-sm">No chapters written yet.</p>
        ) : (
          <div className="space-y-1">
            <div className="mb-4">
              <ContinueReading slug={slug} totalWrittenChapters={chapters.length} />
            </div>

            {chapters.map((ch) => (
              <Link
                key={ch.number}
                href={`/book/${slug}/chapter/${ch.number}`}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group"
              >
                <span className="text-xs font-mono text-neutral-400 w-8">
                  {String(ch.number).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  {ch.title}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
