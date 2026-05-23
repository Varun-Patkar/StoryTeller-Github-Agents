"use client";

import { Plus } from "lucide-react";
import { useChatState } from "@/components/chat-provider";

export function NewStoryButton() {
  const { openWithPrompt } = useChatState();

  return (
    <button
      onClick={() =>
        openWithPrompt("I want to create a new story. Ask me what kind of story I want to write.")
      }
      className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity self-start sm:self-auto"
    >
      <Plus className="w-4 h-4" />
      New Story
    </button>
  );
}
