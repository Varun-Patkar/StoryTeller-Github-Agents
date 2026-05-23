import { NextResponse } from "next/server";
import {
  getGitStatus,
  getGitLog,
  stageAll,
  commitChanges,
  pushChanges,
  pullChanges,
  suggestCommitMessage,
} from "@/lib/git";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = getGitStatus();
    const log = getGitLog(30);
    const suggestedMessage = status.hasChanges ? suggestCommitMessage(status) : "";

    return NextResponse.json({ status, log, suggestedMessage });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, message } = body as { action: string; message?: string };

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
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
