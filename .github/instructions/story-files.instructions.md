---
description: "Conventions for story content files (config, plan, summary, chapters, research). Use when: creating or editing story files in books/, modifying story structure, working with markdown story content."
applyTo: "books/**/*.md"
---

# Story File Conventions

## Directory Structure

Every story at `books/<slug>/` must have:
- `config.md` — Markdown table with key-value settings (parsed by `webapp/lib/config-parser.ts`)
- `plan.md` — Arc-by-arc chapter outline
- `summary.md` — Running chapter summaries (appended after each chapter)
- `chapters/` — Chapter files named `chapter-01.md`, `chapter-02.md` (zero-padded)
- `research/` — Fandom research and character voice files

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
- Slugs are used as URL segments in the webapp
