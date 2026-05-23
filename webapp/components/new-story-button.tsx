"use client";

import { useState } from "react";
import { Plus, GitBranch, X } from "lucide-react";
import { useChatState } from "@/components/chat-provider";

export function NewStoryButton() {
  const { openWithPrompt } = useChatState();
  const [showInput, setShowInput] = useState(false);
  const [branchName, setBranchName] = useState("book/");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      // Create and switch to new branch
      const res = await fetch("/api/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-branch", branchName: branchName.trim() }),
      });
      const json = await res.json();
      if (json.error) {
        alert(`Failed to create branch: ${json.error}`);
        setCreating(false);
        return;
      }
    } catch {
      // Branch creation failed, but we can still proceed
    }
    setCreating(false);
    setShowInput(false);
    setBranchName("book/");
    openWithPrompt("I want to create a new story. Ask me what kind of story I want to write.");
  };

  if (showInput) {
    return (
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
          <input
            autoFocus
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && branchName.trim()) handleCreate();
              if (e.key === "Escape") { setShowInput(false); setBranchName("book/"); }
            }}
            placeholder="book/my-story-name"
            className="text-sm bg-transparent focus:outline-none w-44 font-mono"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={creating || !branchName.trim()}
          className="text-sm font-medium px-3 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {creating ? "Creating..." : "Create"}
        </button>
        <button
          onClick={() => { setShowInput(false); setBranchName("book/"); }}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowInput(true)}
      className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity self-start sm:self-auto"
    >
      <Plus className="w-4 h-4" />
      New Story
    </button>
  );
}
