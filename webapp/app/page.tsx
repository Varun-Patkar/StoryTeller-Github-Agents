import { getBooks } from "@/lib/books";
import { BookCard } from "@/components/book-card";
import { Library, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const books = await getBooks();

  return (
    <div className="w-full lg:w-[80vw] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Library className="w-7 h-7 text-neutral-400" />
            Library
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5">
            {books.length} book{books.length !== 1 ? "s" : ""} in your
            collection
          </p>
        </div>

        <button
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity self-start sm:self-auto"
          title="Coming soon: GitHub Copilot Chat integration"
        >
          <Plus className="w-4 h-4" />
          New Story
        </button>
      </div>

      {/* Grid */}
      {books.length === 0 ? (
        <div className="text-center py-20">
          <Library className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400">
            No stories yet. Use the StoryTeller agent to create your first
            story.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {books.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
