"use client";

import { useEffect } from "react";
import { useChatState } from "@/components/chat-provider";
import type { ReactNode } from "react";

export function MainContent({ children }: { children: ReactNode }) {
  const { isOpen, setIsOpen } = useChatState();

  // Ctrl+Shift+C to toggle chat, Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "c" && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, setIsOpen]);

  return (
    <main
      className={`flex-1 min-w-0 transition-all duration-300 ${
        isOpen ? "lg:mr-[20vw] lg:min-[320px]:mr-[320px]" : ""
      }`}
    >
      {children}
    </main>
  );
}
