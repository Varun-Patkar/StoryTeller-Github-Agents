import { NextResponse } from "next/server";
import { getClient } from "@/lib/copilot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await getClient();
    const models = await client.listModels();

    return NextResponse.json({
      models: models.map((m) => ({
        id: m.id,
        name: m.name,
        supportsReasoning: !!(m.supportedReasoningEfforts && m.supportedReasoningEfforts.length > 0),
        reasoningLevels: m.supportedReasoningEfforts || [],
        defaultReasoning: m.defaultReasoningEffort,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
