import { NextResponse } from "next/server";
import {
  getGitStatus,
  getGitLog,
  stageAll,
  commitChanges,
  pushChanges,
  pullChanges,
  undoFile,
  undoAllChanges,
  listBranches,
  createBranch,
  switchBranch,
  mergeBranch,
  deleteBranch,
  suggestCommitMessage,
} from "@/lib/git";
import { generateCommitMessage } from "@/lib/commit-message";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = getGitStatus();
    const log = getGitLog(30);
    const branches = status.isRepo ? listBranches() : { current: "", branches: [] };
    const suggestedMessage = status.hasChanges ? suggestCommitMessage(status) : "";

    return NextResponse.json({ status, log, branches, suggestedMessage });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, message, filePath } = body as { action: string; message?: string; filePath?: string };

    switch (action) {
      case "stage-all": {
        stageAll();
        return NextResponse.json({ ok: true });
      }
      case "commit": {
        if (!message || typeof message !== "string") {
          return NextResponse.json({ error: "Message required" }, { status: 400 });
        }
        stageAll();
        const hash = commitChanges(message);
        return NextResponse.json({ ok: true, hash });
      }
      case "push": {
        pushChanges();
        return NextResponse.json({ ok: true });
      }
      case "pull": {
        pullChanges();
        return NextResponse.json({ ok: true });
      }
      case "undo-file": {
        if (!filePath || typeof filePath !== "string") {
          return NextResponse.json({ error: "filePath required" }, { status: 400 });
        }
        undoFile(filePath);
        return NextResponse.json({ ok: true });
      }
      case "undo-all": {
        undoAllChanges();
        return NextResponse.json({ ok: true });
      }
      case "generate-message": {
        const message = await generateCommitMessage();
        return NextResponse.json({ ok: true, message });
      }
      case "create-branch": {
        const name = (body as { branchName?: string }).branchName;
        if (!name) return NextResponse.json({ error: "branchName required" }, { status: 400 });
        createBranch(name);
        return NextResponse.json({ ok: true, branch: name });
      }
      case "switch-branch": {
        const name = (body as { branchName?: string }).branchName;
        const isRemote = (body as { isRemote?: boolean }).isRemote || false;
        if (!name) return NextResponse.json({ error: "branchName required" }, { status: 400 });
        switchBranch(name, isRemote);
        return NextResponse.json({ ok: true, branch: name });
      }
      case "merge-branch": {
        const name = (body as { branchName?: string }).branchName;
        if (!name) return NextResponse.json({ error: "branchName required" }, { status: 400 });
        const result = mergeBranch(name);
        return NextResponse.json({ ok: true, result });
      }
      case "delete-branch": {
        const name = (body as { branchName?: string }).branchName;
        if (!name) return NextResponse.json({ error: "branchName required" }, { status: 400 });
        deleteBranch(name);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
