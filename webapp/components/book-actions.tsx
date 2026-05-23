"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useChatState } from "@/components/chat-provider";
import { Trash2, PenLine, AlertTriangle } from "lucide-react";

export function DeleteChapterButton({
  slug,
  chapterNum,
}: {
  slug: string;
  chapterNum: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const res = await fetch(`/api/books/${slug}/chapters/${chapterNum}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    }
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleDelete}
          className="text-[10px] px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[10px] px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirming(true);
      }}
      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 transition-all"
      title="Delete chapter"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

export function GenerateNextChapterButton({
  slug,
  bookTitle,
}: {
  slug: string;
  bookTitle: string;
}) {
  const { openWithPrompt } = useChatState();

  return (
    <button
      onClick={() =>
        openWithPrompt(
          `Write the next chapter for "${bookTitle}" (book slug: ${slug}). Read the config, plan, and summary first, then create and write the chapter.`
        )
      }
      className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
    >
      <PenLine className="w-4 h-4" />
      Generate Next Chapter
    </button>
  );
}

export function DeleteBookButton({ slug }: { slug: string }) {
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const res = await fetch(`/api/books/${slug}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
    }
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            Delete this book and all its chapters?
          </p>
          <p className="text-xs text-red-500/70 mt-0.5">
            This cannot be undone.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600"
          >
            Delete
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-xs px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Delete Book
    </button>
  );
}
