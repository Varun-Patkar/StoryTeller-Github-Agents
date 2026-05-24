# StoryTeller Agents — Copilot Instructions

## Project Overview

Two-part project: VS Code/Copilot **agents** that write webnovel-style fiction, and a **Next.js webapp** for reading/managing the stories.

- Agents: `.github/agents/` — three-agent system (storyteller, story-setup, story-runner)
- Webapp: `webapp/` — Next.js 16, React 19, Tailwind 4, Copilot SDK
- Stories: `books/<slug>/` — file-system-based story storage (no database)

See [README.md](../README.md) for architecture, agent roles, and story modes.

## Commands

```bash
# Webapp
cd webapp
npm run dev      # Dev server on localhost:3000
npm run build    # Production build
npm run lint     # ESLint

# SearXNG (required for agent web research)
docker run -d --name searxng -p 8080:8080 searxng/searxng
```

## Story Structure

Each story lives at `books/<slug>/` with this layout:

```
books/<slug>/
├── config.md          # Markdown table of settings (parsed by config-parser.ts)
├── plan.md            # Arc-by-arc chapter outline
├── summary.md         # Running chapter summaries
├── chapters/chapter-01.md ...
└── research/          # Fandom wiki research + character voice files
```

## Webapp Conventions

- **Framework**: Next.js 16 (breaking changes from prior versions — check `node_modules/next/dist/docs/`)
- **Path alias**: `@/*` maps to `webapp/*`
- **No database**: All data is file-system reads from `books/` directory
- **Chat**: SSE streaming via `/api/chat` with Copilot SDK; React Context for state
- **Security**: Path traversal protection via `safePath()` / `safeBookPath()` in `lib/books.ts`
- **Validation**: Zod schemas for all tool inputs and API payloads
- **Components**: `"use client"` directives; PascalCase filenames; kebab-case for slugs
- **API routes**: `GET`/`POST`/`DELETE` handlers; `NextResponse.json()`; status codes 400/404/500

## Agent Conventions

- Agents are defined in `.github/agents/*.agent.md`
- The webapp merges all three agent prompts into a single system prompt (`lib/storyteller-prompt.ts`)
- Tools are defined in `lib/storyteller-tools.ts` (20+ tools, all Zod-validated, all auto-approved)
- Web research uses SearXNG MCP tools (`searxng/search`, `searxng/fetch_page`) on `localhost:8080`
- Git operations wrapped in `lib/git.ts` with input sanitization

## Writing Rules (for agent prompt editing)

The agents enforce strict anti-AI-slop rules. When editing agent prompts:
- Maintain the banned words/phrases lists
- Preserve the scene weight system (Heavy/Medium/Light/Skip)
- Keep character voice file requirements (quotes + speech patterns)
- Don't weaken tonal variation rules

## Key Files

| File | Purpose |
|------|---------|
| `webapp/lib/storyteller-prompt.ts` | Merged 3-agent system prompt |
| `webapp/lib/storyteller-tools.ts` | All Copilot-accessible tools |
| `webapp/lib/books.ts` | Story CRUD (file-system) |
| `webapp/lib/copilot.ts` | Copilot SDK singleton lifecycle |
| `webapp/lib/git.ts` | Git operations wrapper |
| `webapp/lib/config-parser.ts` | Markdown table → key-value parser |
| `webapp/components/chat-provider.tsx` | Global chat state (Context + localStorage) |
