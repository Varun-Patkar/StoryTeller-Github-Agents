---
description: "Conventions for writing and editing StoryTeller skill files. Use when: editing skill prompts under .github/skills/, modifying writing rules, updating banned phrases/anti-slop lists, changing the scene weight system, editing the chapter pipeline, voice, canon, or graph-memory rules."
applyTo: ".github/skills/**/*.md"
---

# StoryTeller Skill Editing Rules

The StoryTeller system is a set of **skills** (not agents), each in
`.github/skills/<name>/SKILL.md`, auto-invoked by their `description`. Drafting, canon decisions,
voice work, and memory updates run in the current conversation so context is preserved. The sole
delegation exception is the mandatory independent AI-ness review in `write-chapter`: a fresh
subagent reviews the finished prose without editing it, then the current conversation applies the
de-polish pass.

## Skill roster (keep this consistent)

| Skill | Role |
| ----- | ---- |
| `storyteller` | Router. Front door for any story request; dispatches to the others. |
| `story-setup` | New story: questionnaire, canon research, memory graph, plan. |
| `write-chapter` | The per-chapter pipeline (one session = one chapter). |
| `character-voice` | Grounded, tracked character voice + the voice gate. |
| `humanize-prose` | The de-perfect pass; owns the anti-slop bible. |

When adding cross-references between skills, refer to them by name (e.g. "run the `humanize-prose`
skill"), not by file path, since skills are discovered by description. Keep each `SKILL.md` under
~500 lines and push detail into `references/` one level deep.

## Anti-slop lists

The canonical banned-word/phrase lists live in
`.github/skills/humanize-prose/references/anti-slop.md`, with a condensed always-on echo in
`.github/instructions/writing-style.instructions.md`. When editing:
- Never remove items from banned lists without explicit user approval.
- Add new banned patterns when spotted in generated output.
- The **"X, not Y" antithesis tic** is the top-priority ban; do not weaken it.
- Keep both the bible and the condensed instruction in sync.

## Scene weight system

`write-chapter` uses a 4-tier scene classification. Do not collapse the tiers or change their
definitions:
- **Heavy** — pivotal, slow, high detail (usually the emotional beats).
- **Medium** — normal narrative flow.
- **Light** — 1-3 lines, transitional.
- **Skip** — chronicle in `summary.md` only.

## Character voice

Character voice lives in each character's graph node **Voice & Mannerisms** section
(Baseline + verbatim Source Quotes + Voice Evolution). It must be grounded in real source dialogue
and tracked over time. Do not remove the voice-gate requirement from `write-chapter` or the
grounding requirement from `character-voice`/`story-setup`.

## Graph = memory

The graph is memory, not a chronicle. Preserve the Graph Worthiness Test and the rule that `event`
nodes are reserved for major canon-divergence anchors (see `story-files.instructions.md`). Do not
reintroduce per-chapter event logging into the graph.

## Combat & emotion

Keep the rules that combat stays brief, competence is quiet (no risk-setting monologues before
routine fights), and emotion outranks mechanics. Do not weaken these.
