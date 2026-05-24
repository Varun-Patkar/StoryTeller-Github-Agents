---
description: "Conventions for writing and editing storyteller agent prompt files (.agent.md). Use when: editing agent prompts, modifying writing rules, updating banned phrases, changing scene weight system, editing story workflow phases."
applyTo: ".github/agents/*.agent.md"
---

# Agent Prompt Editing Rules

## Anti-AI-Slop Lists

The agent prompts contain carefully curated banned words/phrases. When editing:
- Never remove items from banned lists without explicit user approval
- Add new banned patterns when spotted in generated output
- Keep the lists organized by category (prose clichés, AI transforms, structural patterns)

## Scene Weight System

The story-runner uses a 4-tier scene classification:
- **Heavy** — Pivotal moments, slow pacing, high detail
- **Medium** — Normal narrative flow
- **Light** — 1-3 lines, transitional
- **Skip** — Mentioned in summary only

Do not collapse these tiers or change their definitions.

## Character Voice Files

Research files in `books/<slug>/research/characters/` must include:
- Exact quotes from source material
- Speech patterns and verbal tics
- Vocabulary level and register

The story-runner reads these before every chapter. Do not remove the requirement.

## Prompt Architecture

The three agents are merged into one system prompt by `webapp/lib/storyteller-prompt.ts`.
Each `.agent.md` contributes a section. Changes to one affect the merged output.
