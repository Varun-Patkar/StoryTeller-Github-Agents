---
description: "Conventions for story content files (config, plan, summary, chapters) and the per-story knowledge graph. Use when: creating or editing story files in books/, modifying story structure, working with markdown story content or the graph."
applyTo: "books/**/*.md"
---

# Story File Conventions

## Directory Structure

Every story at `books/<slug>/` must have:
- `config.md` — Markdown table with key-value settings (parsed by `reader/src/lib/books.ts`)
- `plan.md` — Arc-by-arc chapter outline (may reference graph node ids)
- `summary.md` — Running chapter summaries (appended after each chapter)
- `chapters/` — Chapter files named `chapter-01.md`, `chapter-02.md` (zero-padded)
- `graph/` — Per-story knowledge graph: `graph.db` (SQLite nodes + edges) and `nodes/<id>.md` (one markdown body per node)

## Knowledge Graph

Research and evolving story state live in the graph, not in loose files. Edit it **only**
via the CLI at `.github/scripts/graph.mjs` (never touch `graph.db` or `nodes/*.md` by hand),
so ids stay deterministic and duplicates are impossible. Run
`node .github/scripts/graph.mjs schema` for the allowed node types, edge types, and
canonicity values (`canon`/`au`/`original`).

**Keep the graph dense.** One node per distinct entity — a separate node for each character,
location, faction, item, ability, concept, and arc. Never lump entities into a shared node
(no "supporting cast" or "world building" bundle). Wire up edges for every relationship so no
node is orphaned; a dense web of connections is the whole point.

## Config Format

Config uses pipe-delimited markdown tables:
```markdown
| Setting | Value |
| ------- | ----- |
| Type    | Fanfiction |
| Fandom  | ... |
```

Do not change the table format — the parser expects exactly this structure.

## Slug Rules

- Book directory names use kebab-case: `new-game-plus-the-last-of-us`
- No spaces, underscores, or special characters in slugs
- Slugs are used as URL segments in the reader
