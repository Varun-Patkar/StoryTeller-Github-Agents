---
description: "Conventions for webapp TypeScript/React files. Use when: editing webapp components, API routes, lib utilities, or adding new features to the Next.js webapp."
applyTo: "webapp/**/*.{ts,tsx}"
---

# Webapp Code Conventions

## Security

- All file paths touching `books/` must go through `safePath()` or `safeBookPath()` from `lib/books.ts`
- Validate all inputs with Zod schemas — no raw `req.body` access
- Sanitize git inputs via `lib/git.ts` wrappers — never shell out directly

## API Routes

- Export named handlers: `GET`, `POST`, `DELETE`
- Return `NextResponse.json(data, { status })` with appropriate codes (400/404/500)
- Streaming responses use SSE with event types: `delta`, `reasoning`, `tool`, `usage`

## Components

- Add `"use client"` directive for any component using hooks or browser APIs
- Use PascalCase for component filenames
- Use kebab-case for URL slugs and book directories

## Data Flow

- No database — all reads from `../books/` via `lib/books.ts`
- Chat state lives in React Context (`components/chat-provider.tsx`) + localStorage
- Copilot SDK is a singleton (`lib/copilot.ts`) — do not instantiate directly

## Next.js 16

This project uses Next.js 16 which has breaking changes from earlier versions.
Always consult `node_modules/next/dist/docs/` before using any Next.js API.
