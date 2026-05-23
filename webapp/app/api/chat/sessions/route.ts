import { NextResponse } from "next/server";
import { getClient } from "@/lib/copilot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await getClient();
    const sessions = await client.listSessions();
    return NextResponse.json({
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        startTime: s.startTime,
        modifiedTime: s.modifiedTime,
        summary: s.summary,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }
    const client = await getClient();
    await client.deleteSession(sessionId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
