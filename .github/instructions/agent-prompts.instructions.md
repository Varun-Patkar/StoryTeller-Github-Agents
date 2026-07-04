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

Character nodes in the story's knowledge graph (`books/<slug>/graph/nodes/<id>.md`, edited via
`.github/scripts/graph.mjs`) must include:
- Exact quotes from source material
- Speech patterns and verbal tics
- Vocabulary level and register

The story-runner loads these (via `get-node`) before writing any character. Do not remove the requirement.

## Prompt Architecture

The three agents (`storyteller`, `story-setup`, `story-runner`) each run as standalone
`.agent.md` prompts. The orchestrator (`storyteller`) routes to the other two. Keep shared
conventions (research modes, graph usage, continuity targets) consistent across all three.
