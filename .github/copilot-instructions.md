# StoryTeller project notes

This project is a small fiction-writing system for building stories chapter by chapter. The goal is simple: keep the setup useful, keep the writing process clear, and let the story read like a person wrote it rather than a machine trying to sound clever.

## What matters

- The story workflow lives under .github/skills.
- Each skill is focused on one job: routing, setup, chapter writing, voice, or cleanup.
- The story files under books/ hold the actual draft, plan, and world memory.
- The reader in reader/ is just a way to browse the finished stories.

## Core workflow

1. Start a story with the setup skill.
2. Build the plan and the grounded world details.
3. Write the next chapter with the chapter skill.
4. Keep the voice and tone consistent.
5. Tighten the prose when needed.

## Keep it lean

- Remove extra orchestration and multi-agent ceremony when it does not help the story.
- Prefer direct writing over checklist-heavy prompting.
- Favor natural rhythm, specific detail, and clear story beats over polished corporate phrasing.
- Keep research grounded in the source material when the story is based on canon.

## Important files

- .github/skills/storyteller/SKILL.md
- .github/skills/story-setup/SKILL.md
- .github/skills/write-chapter/SKILL.md
- .github/skills/character-voice/SKILL.md
- .github/skills/humanize-prose/SKILL.md
- .github/scripts/graph.mjs
- reader/src/lib/books.ts

## Writing direction

The prose should feel lived-in, not overworked. Short passages, real emotion, clear action, and character voice matter more than grammar-perfect polish. If a sentence sounds like it was written to impress, cut it.
