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

## Knowledge Graph — the story's MEMORY, not its chronicle

The single most important idea: the graph is **memory**, not a log of everything that happened.
`summary.md` is the chronicle ("what happened, chapter by chapter"). The graph holds only the
facts that must still be true many chapters from now. Confusing the two is what caused the old
node explosion (100+ nodes by chapter 10, most of them one-off "stuff that happened" nodes that
were never referenced again).

Ask of any candidate node/update: **"After this chapter, what is permanently different about the
world?"** — not "what happened in this chapter?".

Edit the graph **only** via the CLI at `.github/scripts/graph.mjs` (never touch `graph.db` or
`nodes/*.md` by hand), so ids stay deterministic and duplicates are impossible. Run
`node .github/scripts/graph.mjs schema` for the allowed node types, edge types, and canonicity
values (`canon`/`au`/`original`).

### The Graph Worthiness Test

Store a node/update only if it answers **yes** to at least one:
- Does it permanently change a relationship? (trust, alliance, enmity, family)
- Does it permanently change inventory/ownership? (gained, lost, destroyed)
- Does it unlock or gate future plot?
- Does it change world-state? (a place destroyed, a faction's leader dead, a law changed)
- Does it change what a character permanently **knows** or believes?
- Will it still matter ~20 chapters later?

If deleting the fact would leave future chapters just as writable, it does **not** belong in the
graph. Put it in `summary.md` instead. Ban nodes for: one-off actions, travel, scenery, routine
conversations, passing emotions, and "this chapter's events".

### Persistent state, not history

Model nodes as the **current state** of the world, like a save file, not a timeline of actions.
Prefer updating an existing entity's node (its relationships, inventory, knowledge, world-state)
over creating a new "event" node.

- **`event` nodes are the exception, not the rule.** Create one only for a **major canon-
  divergence event** that later chapters must anchor to (a permanent break from the source). Give
  it a `diverges_from` edge and record it in the plan's Canon Divergence Register. Do NOT create an
  event node for ordinary happenings.
- **Setup baseline:** at story-setup, the graph captures the standing world (characters, places,
  factions, items, systems, arcs, threads) plus only the load-bearing canon events the plan reasons
  about. During writing, each chapter emits a small **memory diff** — usually a few updates, rarely
  a new node.

### Density still applies (to what you DO store)

One node per distinct entity — a separate node for each character, location, faction, item,
ability, concept, arc, and tracked thread. Never lump entities into a shared node (no "supporting
cast" or "world building" bundle). Wire up edges for every relationship so no node is orphaned;
a dense web of connections is the whole point. Density is about entities and their relationships,
not about logging events.

### Character voice lives in the graph

Each character node body has a **Voice & Mannerisms** section: a source-grounded Baseline, verbatim
**Source Quotes**, and a **Voice Evolution** log that tracks how the voice legitimately changes over
time. See the `character-voice` skill. Update Voice Evolution when a chapter permanently shifts a
character's voice.

### After each chapter
Run `consolidate --story <slug>` (merge true duplicates), then `validate --story <slug>` until
`"ok": true`. New nodes must have edges; no orphans.

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
