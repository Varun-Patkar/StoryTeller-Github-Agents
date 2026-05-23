import { CopilotClient } from "@github/copilot-sdk";
import path from "path";
import { existsSync } from "fs";

// Resolve workspace root (parent of webapp/)
const WEBAPP_DIR = process.cwd();
const WORKSPACE_ROOT = path.resolve(WEBAPP_DIR, "..");

let client: CopilotClient | null = null;
let starting: Promise<void> | null = null;

// Find the copilot CLI binary explicitly
function findCliPath(): string | undefined {
  const candidates = [
    path.join(WEBAPP_DIR, "node_modules", "@github", "copilot-win32-x64", "copilot.exe"),
    path.join(WEBAPP_DIR, "node_modules", "@github", "copilot", "bin", "copilot"),
    path.join(WEBAPP_DIR, "node_modules", ".bin", "copilot"),
    path.join(WEBAPP_DIR, "node_modules", ".bin", "copilot.exe"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return undefined;
}

export async function getClient(): Promise<CopilotClient> {
  if (client) return client;

  if (starting) {
    await starting;
    return client!;
  }

  const cliPath = findCliPath();

  client = new CopilotClient({
    cwd: WORKSPACE_ROOT,
    logLevel: "warning",
    ...(cliPath && { cliPath }),
  });

  starting = client.start();
  await starting;
  starting = null;

  // Cleanup on process exit
  const cleanup = async () => {
    if (client) {
      try {
        await client.stop();
      } catch {}
      client = null;
    }
  };

  process.on("beforeExit", cleanup);
  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(0);
  });

  return client;
}

export { WORKSPACE_ROOT };
