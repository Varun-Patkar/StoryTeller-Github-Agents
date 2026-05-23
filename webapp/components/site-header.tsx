"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { GitPanel } from "@/components/git-panel";
import { useChatState } from "@/components/chat-provider";
import { BookOpen, GitBranch, MessageSquare } from "lucide-react";
import Link from "next/link";

export function SiteHeader() {
  const pathname = usePathname();
  const [gitOpen, setGitOpen] = useState(false);
  const { isOpen: chatOpen, setIsOpen: setChatOpen } = useChatState();

  // Hide header on chapter reader pages — they have their own top bar
  if (/^\/book\/[^/]+\/chapter\/\d+/.test(pathname)) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
        <div className="w-full lg:w-[80vw] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-lg tracking-tight hover:opacity-80 transition-opacity"
          >
            <BookOpen className="w-5 h-5" />
            StoryTeller
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                chatOpen ? "bg-neutral-100 dark:bg-neutral-800" : ""
              }`}
              title="StoryTeller Agent"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={() => setGitOpen(!gitOpen)}
              className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                gitOpen ? "bg-neutral-100 dark:bg-neutral-800" : ""
              }`}
              title="Git Manager"
            >
              <GitBranch className="w-5 h-5" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <GitPanel open={gitOpen} onClose={() => setGitOpen(false)} />
    </>
  );
}
