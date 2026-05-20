import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8080";

const server = new McpServer({ name: "searxng", version: "1.0.0" });

server.tool(
  "search",
  "Search the web via SearXNG",
  { query: z.string(), max_results: z.number().optional().default(10) },
  async ({ query, max_results }) => {
    const url = new URL("/search", SEARXNG_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");

    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      return { content: [{ type: "text", text: `SearXNG error: HTTP ${res.status}` }], isError: true };
    }

    const data = await res.json();
    const results = (data.results || []).slice(0, max_results).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
    }));

    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "fetch_page",
  "Fetch and return the text content of a URL",
  { url: z.string().url() },
  async ({ url }) => {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: { "User-Agent": "MCP-SearXNG/1.0" },
    });
    if (!res.ok) {
      return { content: [{ type: "text", text: `Fetch error: HTTP ${res.status}` }], isError: true };
    }

    let text = await res.text();
    // Strip HTML tags for a rough plaintext extraction
    text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<[^>]+>/g, " ");
    text = text.replace(/\s+/g, " ").trim();
    // Truncate to avoid blowing up context
    if (text.length > 30000) text = text.slice(0, 30000) + "\n\n[truncated]";

    return { content: [{ type: "text", text }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
