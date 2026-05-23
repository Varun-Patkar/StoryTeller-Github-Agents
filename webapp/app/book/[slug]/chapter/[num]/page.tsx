import { getBook, getChapter, getChapters } from "@/lib/books";
import { notFound } from "next/navigation";
import ChapterReader from "@/components/chapter-reader";

export const dynamic = "force-dynamic";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; num: string }>;
}) {
  const { slug, num } = await params;
  const chapterNum = parseInt(num, 10);
  if (isNaN(chapterNum) || chapterNum < 1) notFound();

  const [book, chapter, chapters] = await Promise.all([
    getBook(slug),
    getChapter(slug, chapterNum),
    getChapters(slug),
  ]);

  if (!book || !chapter) notFound();

  const totalChapters = Math.max(
    parseInt(book.config.totalChapters) || 0,
    chapters.length
  );

  return (
    <ChapterReader
      data={{
        meta: chapter.meta,
        content: chapter.content,
        totalChapters,
        bookTitle: book.config.title || slug,
        slug,
      }}
    />
  );
}
