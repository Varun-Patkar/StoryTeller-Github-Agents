<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Webapp Agent Guide

## Stack

Next.js 16 · React 19 · Tailwind 4 · Copilot SDK · Zod 4 · TypeScript (strict)

## Commands

```bash
npm run dev      # Dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Architecture

- **No database** — stories stored as files in `../books/<slug>/`
- **SSE streaming** — `/api/chat` streams agent responses via Server-Sent Events
- **Copilot SDK** — singleton in `lib/copilot.ts`; tools in `lib/storyteller-tools.ts`
- **State** — React Context (`components/chat-provider.tsx`) + localStorage for persistence
- **Path safety** — always use `safePath()` / `safeBookPath()` from `lib/books.ts`

## Patterns

- API routes: `app/api/` with `GET`/`POST`/`DELETE` exports, `NextResponse.json()` responses
- Components: `"use client"` where needed, PascalCase files, kebab-case slugs
- Validation: Zod schemas for tool inputs and API payloads
- Config: Markdown tables parsed by `lib/config-parser.ts`
- Chapters: `chapter-01.md` (zero-padded) in `books/<slug>/chapters/`

## Key Pitfalls

- Next.js 16 has breaking API changes — **always check docs in node_modules**
- Copilot CLI binary path is auto-resolved — don't hardcode
- SearXNG must run on `localhost:8080` for web research tools
- Reading progress is localStorage-only (not server-synced)
