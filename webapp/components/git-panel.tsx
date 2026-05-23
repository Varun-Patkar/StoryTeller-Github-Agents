"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GitBranch,
  GitCommit,
  GitMerge,
  ChevronDown,
  ChevronUp,
  Check,
  Upload,
  Download,
  RefreshCw,
  X,
  FileText,
  FilePlus,
  FileX,
  FileEdit,
  Circle,
  Undo2,
  Sparkles,
} from "lucide-react";

interface GitFileChange {
  status: string;
  file: string;
}

interface GitLogEntry {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  refs: string;
}

interface GitStatus {
  isRepo: boolean;
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  untracked: GitFileChange[];
  hasChanges: boolean;
}

interface GitData {
  status: GitStatus;
  log: GitLogEntry[];
  branches: { current: string; local: string[]; remote: string[] };
  suggestedMessage: string;
  error?: string;
}

function FileIcon({ status }: { status: string }) {
  switch (status) {
    case "A":
    case "??":
      return <FilePlus className="w-3.5 h-3.5 text-emerald-500" />;
    case "M":
      return <FileEdit className="w-3.5 h-3.5 text-amber-500" />;
    case "D":
      return <FileX className="w-3.5 h-3.5 text-red-500" />;
    default:
      return <FileText className="w-3.5 h-3.5 text-neutral-400" />;
  }
}

function StatusLabel({ status }: { status: string }) {
  const labels: Record<string, string> = {
    A: "Added",
    M: "Modified",
    D: "Deleted",
    "??": "New",
  };
  return (
    <span className="text-[10px] font-mono opacity-50">
      {labels[status] || status}
    </span>
  );
}

export function GitPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<GitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [generatingMsg, setGeneratingMsg] = useState(false);
  const [showBranches, setShowBranches] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [showNewBranch, setShowNewBranch] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/git");
      const json = await res.json();
      if (json.error) {
        setData({ status: { isRepo: false, branch: "", ahead: 0, behind: 0, staged: [], unstaged: [], untracked: [], hasChanges: false }, log: [], branches: { current: "", local: [], remote: [] }, suggestedMessage: "", error: json.error });
      } else {
        setData(json);
        if (json.suggestedMessage && !commitMsg) {
          setCommitMsg(json.suggestedMessage);
        }
      }
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [commitMsg]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  const doAction = async (action: string, message?: string, filePath?: string, branchName?: string, isRemote?: boolean) => {
    setActing(true);
    try {
      const res = await fetch("/api/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, message, filePath, branchName, isRemote }),
      });
      const json = await res.json();
      if (json.error) {
        setToast(`Error: ${json.error}`);
      } else {
        const msgs: Record<string, string> = {
          commit: `Committed: ${json.hash}`,
          push: "Pushed successfully",
          pull: "Pulled successfully",
          "create-branch": `Branch created: ${branchName}`,
          "switch-branch": `Switched to: ${branchName}`,
          "merge-branch": "Merged successfully",
          "delete-branch": `Deleted: ${branchName}`,
          "undo-all": "All changes discarded",
          "undo-file": `Reverted: ${filePath}`,
        };
        setToast(msgs[action] || "Done");
        if (action === "commit") setCommitMsg("");
        if (action === "create-branch") { setShowNewBranch(false); setNewBranchName(""); }
        await fetchData();
      }
    } catch {
      setToast("Action failed");
    }
    setActing(false);
    setTimeout(() => setToast(null), 3000);
  };

  if (!open) return null;

  const allChanges = data
    ? [
        ...data.status.staged.map((f) => ({ ...f, section: "staged" as const })),
        ...data.status.unstaged.map((f) => ({ ...f, section: "unstaged" as const })),
        ...data.status.untracked.map((f) => ({ ...f, section: "untracked" as const })),
      ]
    : [];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-14 right-0 sm:right-4 w-full sm:w-[420px] max-h-[calc(100vh-4rem)] z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-neutral-500" />
            <h2 className="font-semibold text-sm">Git Manager</h2>
            {data?.status.branch && (
              <button
                onClick={() => setShowBranches(!showBranches)}
                className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                {data.status.branch}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showBranches ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Branch management dropdown */}
        {showBranches && data?.status.isRepo && (
          <div className="border-b border-neutral-200 dark:border-neutral-800 px-3 py-2 space-y-2">
            {/* Branch list */}
            <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
              {/* Local branches */}
              {data.branches?.local.map((b) => (
                <div key={b} className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => doAction("switch-branch", undefined, undefined, b)}
                    disabled={acting || b === data.status.branch}
                    className={`flex-1 text-left px-2 py-1.5 rounded-lg transition-colors ${
                      b === data.status.branch
                        ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <span className="font-mono">{b}</span>
                    {b === data.status.branch && (
                      <span className="ml-1 text-[10px] text-emerald-500">current</span>
                    )}
                  </button>
                  {b !== data.status.branch && b !== "main" && (
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => doAction("merge-branch", undefined, undefined, b)}
                        disabled={acting}
                        className="p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-neutral-400 hover:text-blue-500 transition-colors"
                        title={`Merge ${b} into ${data.status.branch}`}
                      >
                        <GitMerge className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete branch "${b}"?`)) {
                            doAction("delete-branch", undefined, undefined, b);
                          }
                        }}
                        disabled={acting}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                        title={`Delete ${b}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Remote branches */}
              {data.branches?.remote.length > 0 && (
                <>
                  <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider px-2 pt-2 pb-1">
                    Remote
                  </div>
                  {data.branches.remote.map((b) => (
                    <div key={`remote-${b}`} className="flex items-center gap-2 text-xs">
                      <button
                        onClick={() => doAction("switch-branch", undefined, undefined, b, true)}
                        disabled={acting}
                        className="flex-1 text-left px-2 py-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <span className="font-mono text-neutral-500 dark:text-neutral-400">{b}</span>
                        <span className="ml-1 text-[10px] text-neutral-400">origin</span>
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* New branch */}
            {showNewBranch ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newBranchName.trim()) {
                      doAction("create-branch", undefined, undefined, newBranchName.trim());
                    }
                    if (e.key === "Escape") { setShowNewBranch(false); setNewBranchName(""); }
                  }}
                  placeholder="book/my-new-story"
                  className="flex-1 text-xs px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600 font-mono"
                />
                <button
                  onClick={() => {
                    if (newBranchName.trim()) doAction("create-branch", undefined, undefined, newBranchName.trim());
                  }}
                  disabled={acting || !newBranchName.trim()}
                  className="text-[11px] font-medium px-2 py-1 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 disabled:opacity-40"
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowNewBranch(false); setNewBranchName(""); }}
                  className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewBranch(true)}
                className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                <GitBranch className="w-3 h-3" />
                New Branch
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!data ? (
            <div className="p-6 text-center text-sm text-neutral-400">
              Loading...
            </div>
          ) : data.error ? (
            <div className="p-6 text-center text-sm text-red-500">
              {data.error}
            </div>
          ) : !data.status.isRepo ? (
            <div className="p-6 text-center text-sm text-neutral-400">
              Not a git repository
            </div>
          ) : (
            <>
              {/* Sync status */}
              {(data.status.ahead > 0 || data.status.behind > 0) && (
                <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3 text-xs">
                  {data.status.ahead > 0 && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Upload className="w-3 h-3" />
                      {data.status.ahead} ahead
                    </span>
                  )}
                  {data.status.behind > 0 && (
                    <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                      <Download className="w-3 h-3" />
                      {data.status.behind} behind
                    </span>
                  )}
                  <div className="flex-1" />
                  {data.status.behind > 0 && (
                    <button
                      onClick={() => doAction("pull")}
                      disabled={acting}
                      className="text-xs px-2 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-50"
                    >
                      Pull
                    </button>
                  )}
                  {data.status.ahead > 0 && (
                    <button
                      onClick={() => doAction("push")}
                      disabled={acting}
                      className="text-xs px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50"
                    >
                      Push
                    </button>
                  )}
                </div>
              )}

              {/* Changes */}
              {allChanges.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">
                    Everything up to date
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    No uncommitted changes
                  </p>
                </div>
              ) : (
                <>
                  {/* File list */}
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 px-1 mb-2">
                      {allChanges.length} changed file
                      {allChanges.length !== 1 ? "s" : ""}
                    </p>
                    <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                      {allChanges.map((f, i) => (
                        <div
                          key={`${f.file}-${i}`}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 group/file"
                        >
                          <FileIcon status={f.status} />
                          <span className="flex-1 truncate font-mono text-[11px]">
                            {f.file}
                          </span>
                          {f.section !== "untracked" && (
                            <button
                              onClick={() =>
                                doAction("undo-file", undefined, f.file)
                              }
                              disabled={acting}
                              className="opacity-0 group-hover/file:opacity-100 p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-all disabled:opacity-50"
                              title="Revert file"
                            >
                              <Undo2 className="w-3 h-3" />
                            </button>
                          )}
                          <StatusLabel status={f.status} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Commit form */}
                  <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800">
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">
                      Commit Message
                    </label>
                    <textarea
                      value={commitMsg}
                      onChange={(e) => setCommitMsg(e.target.value)}
                      placeholder="Describe your changes..."
                      rows={2}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 resize-none focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
                    />
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={async () => {
                          setGeneratingMsg(true);
                          try {
                            const res = await fetch("/api/git", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "generate-message" }),
                            });
                            const json = await res.json();
                            if (json.message) setCommitMsg(json.message);
                          } catch {}
                          setGeneratingMsg(false);
                        }}
                        disabled={generatingMsg || acting}
                        className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-50"
                      >
                        <Sparkles className={`w-3 h-3 ${generatingMsg ? "animate-pulse" : ""}`} />
                        {generatingMsg ? "Generating..." : "AI Generate"}
                      </button>
                      {data.suggestedMessage && commitMsg !== data.suggestedMessage && (
                        <button
                          onClick={() => setCommitMsg(data.suggestedMessage)}
                          className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:underline truncate"
                        >
                          Use quick: &ldquo;{data.suggestedMessage.substring(0, 40)}
                          {data.suggestedMessage.length > 40 ? "…" : ""}&rdquo;
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => doAction("commit", commitMsg)}
                        disabled={acting || !commitMsg.trim()}
                        className="flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-40"
                      >
                        <GitCommit className="w-4 h-4" />
                        Commit All
                      </button>
                      <button
                        onClick={async () => {
                          await doAction("commit", commitMsg);
                          await doAction("push");
                        }}
                        disabled={acting || !commitMsg.trim()}
                        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40"
                      >
                        <Upload className="w-4 h-4" />
                        Commit & Push
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Log toggle + Undo last commit */}
              <div className="border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center">
                  <button
                    onClick={() => setShowLog(!showLog)}
                    className="flex-1 flex items-center justify-between px-4 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <span>Commit History</span>
                    {showLog ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {data.log.length > 0 && allChanges.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm("Discard ALL local changes? This cannot be undone.")) {
                          doAction("undo-all");
                        }
                      }}
                      disabled={acting}
                      className="px-3 py-2 text-[10px] font-medium text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                      title="Discard all local changes"
                    >
                      <Undo2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {showLog && (
                  <div className="px-3 pb-3 max-h-[300px] overflow-y-auto">
                    {data.log.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-4">
                        No commits yet
                      </p>
                    ) : (
                      <div className="space-y-0.5">
                        {data.log.map((entry, i) => (
                          <div
                            key={entry.hash}
                            className="flex gap-3 px-2 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          >
                            {/* Graph line */}
                            <div className="flex flex-col items-center pt-1">
                              <Circle
                                className={`w-2.5 h-2.5 ${
                                  i === 0
                                    ? "text-blue-500 fill-blue-500"
                                    : "text-neutral-300 dark:text-neutral-600 fill-neutral-300 dark:fill-neutral-600"
                                }`}
                              />
                              {i < data.log.length - 1 && (
                                <div className="w-px flex-1 bg-neutral-200 dark:bg-neutral-700 mt-1" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium leading-tight truncate">
                                {entry.message}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-neutral-400">
                                  {entry.shortHash}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {entry.date}
                                </span>
                                {entry.refs && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                    {entry.refs}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-4 left-4 right-4 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm text-center shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
