"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChatState } from "@/components/chat-provider";
import { ChatMessageBubble } from "@/components/chat-message";
import {
  X,
  Send,
  Square,
  Trash2,
  ChevronDown,
  MessageSquare,
  Zap,
  Cpu,
} from "lucide-react";

export function ChatPanel() {
  const {
    isOpen,
    setIsOpen,
    messages,
    isStreaming,
    tokenUsage,
    contextUsage,
    model,
    setModel,
    reasoningEffort,
    setReasoningEffort,
    availableModels,
    currentModelInfo,
    sendMessage,
    abortGeneration,
    clearMessages,
  } = useChatState();

  const [input, setInput] = useState("");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelSearchRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    await sendMessage(trimmed);
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 top-14 bg-black/30 z-40 lg:hidden chat-backdrop-enter"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div className="fixed top-14 right-0 bottom-0 w-full sm:w-[380px] lg:w-[20vw] lg:min-w-[320px] z-50 lg:z-20 bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 flex flex-col shadow-2xl lg:shadow-none chat-panel-enter">
        {/* Header */}
        <div className="shrink-0 border-b border-neutral-200 dark:border-neutral-800 px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-sm">StoryTeller</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearMessages}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                title="New conversation"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Model selector row */}
          <div className="flex items-center gap-2 text-xs">
            <div className="relative">
              <button
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <Cpu className="w-3 h-3 text-neutral-400" />
                <span className="font-medium truncate max-w-[120px]">
                  {currentModelInfo?.name || model}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showModelMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => { setShowModelMenu(false); setModelSearch(""); }}
                  />
                  <div className="absolute top-full left-0 mt-1 z-20 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[300px]">
                    <div className="px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                      <input
                        ref={modelSearchRef}
                        autoFocus
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Search models..."
                        className="w-full text-xs px-2 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600"
                      />
                    </div>
                    <div className="overflow-y-auto">
                      {availableModels.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-neutral-400">Loading models...</p>
                      ) : (
                        availableModels
                          .filter((m) => {
                            if (!modelSearch) return true;
                            const q = modelSearch.toLowerCase();
                            return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
                          })
                          .map((m) => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setModel(m.id);
                                setShowModelMenu(false);
                                setModelSearch("");
                              }}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                                model === m.id
                                  ? "bg-neutral-50 dark:bg-neutral-800 font-medium"
                                  : ""
                              }`}
                            >
                              {m.name}
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Reasoning effort — only show if current model supports it */}
            {currentModelInfo?.supportsReasoning && currentModelInfo.reasoningLevels.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <Zap className="w-3 h-3 text-neutral-400" />
                {currentModelInfo.reasoningLevels.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReasoningEffort(r)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors capitalize ${
                      reasoningEffort === r
                        ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                        : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* Context window usage circle */}
            {contextUsage.tokenLimit > 1 && (
              <div className="relative ml-auto group">
                <div className="w-7 h-7 cursor-pointer">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle
                      cx="18" cy="18" r="15"
                      fill="none"
                      stroke="currentColor"
                      className="text-neutral-200 dark:text-neutral-700"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18" cy="18" r="15"
                      fill="none"
                      stroke="currentColor"
                      className={
                        contextUsage.percent > 80
                          ? "text-red-500"
                          : contextUsage.percent > 50
                          ? "text-amber-500"
                          : "text-blue-500"
                      }
                      strokeWidth="3"
                      strokeDasharray={`${contextUsage.percent * 0.942} 94.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-neutral-500 dark:text-neutral-400">
                    {contextUsage.percent}%
                  </span>
                </div>
                {/* Hover tooltip */}
                <div className="absolute right-0 top-full mt-1.5 w-52 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl text-[11px] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-30 space-y-1.5">
                  <div className="font-semibold text-xs mb-2">Context Window</div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Total</span>
                    <span className="font-mono">{(contextUsage.currentTokens / 1000).toFixed(1)}K / {(contextUsage.tokenLimit / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">System</span>
                    <span className="font-mono">{((contextUsage.systemTokens / contextUsage.tokenLimit) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Tool Definitions</span>
                    <span className="font-mono">{((contextUsage.toolDefinitionsTokens / contextUsage.tokenLimit) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Messages</span>
                    <span className="font-mono">{((contextUsage.conversationTokens / contextUsage.tokenLimit) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <span>{contextUsage.messagesLength} messages</span>
                    <span className="font-mono">{contextUsage.percent}% used</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MessageSquare className="w-10 h-10 text-neutral-200 dark:text-neutral-700 mb-3" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                StoryTeller Agent
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Ask me to create a new story, write the next chapter, or manage
                your library.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-neutral-200 dark:border-neutral-800 px-3 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message StoryTeller..."
              rows={1}
              className="flex-1 resize-none text-sm px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 max-h-[120px] overflow-y-auto"
              style={{ minHeight: "38px" }}
              onInput={(e) => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "38px";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
            {isStreaming ? (
              <button
                onClick={abortGeneration}
                className="p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-30 shrink-0"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
