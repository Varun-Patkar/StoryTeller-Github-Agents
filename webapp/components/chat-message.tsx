"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, ToolCallInfo } from "@/components/chat-provider";
import {
  ChevronDown,
  ChevronRight,
  Wrench,
  Check,
  Loader2,
  AlertCircle,
  Brain,
  User,
  Bot,
} from "lucide-react";

function ToolCallCard({ tc }: { tc: ToolCallInfo }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-2 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
      >
        {tc.status === "running" ? (
          <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
        ) : tc.status === "done" ? (
          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
        )}
        <Wrench className="w-3 h-3 text-neutral-400 shrink-0" />
        <span className="font-mono font-medium truncate">{tc.toolName}</span>
        <span className="flex-1" />
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 px-3 py-2 space-y-2">
          <div>
            <span className="text-[10px] font-medium text-neutral-400 uppercase">
              Arguments
            </span>
            <pre className="mt-1 p-2 rounded bg-neutral-50 dark:bg-neutral-800 overflow-x-auto text-[11px] leading-relaxed">
              {JSON.stringify(tc.args, null, 2)}
            </pre>
          </div>
          {tc.result !== undefined && (
            <div>
              <span className="text-[10px] font-medium text-neutral-400 uppercase">
                Result
              </span>
              <pre className="mt-1 p-2 rounded bg-neutral-50 dark:bg-neutral-800 overflow-x-auto text-[11px] leading-relaxed max-h-[200px] overflow-y-auto">
                {typeof tc.result === "string"
                  ? tc.result
                  : JSON.stringify(tc.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReasoningBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!content) return null;

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left my-1 text-xs"
    >
      <div className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
        <Brain className="w-3 h-3" />
        <span className="font-medium">Thinking</span>
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
      </div>
      {expanded && (
        <div className="mt-1.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto">
          {content}
        </div>
      )}
    </button>
  );
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-3">
        <div className="flex items-start gap-2 max-w-[85%]">
          <div className="px-3.5 py-2 rounded-2xl rounded-tr-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm leading-relaxed">
            {message.content}
          </div>
          <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
            <User className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="flex items-start gap-2 max-w-[85%]">
        <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0">
          {/* Reasoning */}
          {message.reasoning && (
            <ReasoningBlock content={message.reasoning} />
          )}

          {/* Tool calls */}
          {message.toolCalls?.map((tc, i) => (
            <ToolCallCard key={`${tc.toolName}-${i}`} tc={tc} />
          ))}

          {/* Content */}
          {message.content && (
            <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-pre:my-1 prose-ul:my-1 max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Streaming indicator */}
          {!message.content &&
            !message.toolCalls?.length &&
            !message.reasoning && (
              <div className="flex items-center gap-1.5 text-neutral-400 text-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
