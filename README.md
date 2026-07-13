# StoryTeller

A set of VS Code / GitHub Copilot **skills** that write webnovel-style fiction chapter by chapter — fanfiction or original. You bring the idea; the system writes the book. The skills run inline (no subagent delegation), so full context is preserved across a session.

## Skills

| Skill | Role |
|-------|------|
| **storyteller** | Router. The front door for any story request; dispatches to the right skill. |
| **story-setup** | Gathers story preferences, deep-researches the fandom via wiki crawling, grounds character voices in real dialogue, builds the memory graph and story plan. |
| **write-chapter** | Writes one chapter per session through a full pipeline (memory → canon lock → blueprint → draft → critic → humanize → save → memory diff). |
| **character-voice** | Builds and tracks each character's voice, grounded in verbatim source dialogue. |
| **humanize-prose** | The de-perfect pass that strips AI tells (the "X, not Y" tic, em dashes, over-detailed fights) out of a draft. |

## How It Works

1. **Say "new story"** → the `story-setup` skill runs.
2. It asks you questions (type, fandom, genre, themes, mode, pacing) and, for fanfiction, the divergence point.
3. It crawls the fandom wiki for deep research — characters, world, power systems, and real quotes to ground each voice.
4. It builds a memory graph and a full plan with arcs, chapter outlines, and interwoven sub-event threads (so multiple storylines stay live at once).
5. **Say "next chapter"** → the `write-chapter` skill runs.
6. It loads memory from the graph, locks un-butterflied events to canon, blueprints scene weights, drafts, then runs a critic pass, a **humanize (de-perfect) pass**, and a final read before saving.
7. You approve or request a rewrite. Repeat.

## Story Modes

- **Here for the Ride** (default) — The system writes each chapter from the plan; you approve or request rewrites.
- **Interactive** — Each chapter ends on a decision point. You pick what happens next.
- **Companion Writer** — You write the first draft of each chapter; the system refines it and fills only the sections you mark, acting as a co-writer and live knowledge base. All creativity stays with you.

## Project Structure

Each story gets its own folder under `books/`:

```
books/<story-name>/
├── config.md          # Story settings
├── plan.md            # Arc-by-arc outline (references graph node ids)
├── summary.md         # Running chapter summaries
├── chapters/          # Written chapters
│   ├── chapter-01.md
│   └── ...
└── graph/             # Knowledge graph: research + story state
    ├── graph.db       # SQLite: nodes + edges
    └── nodes/         # One markdown body per node, named <id>.md
        ├── character-<name>.md
        └── ...
```

## Knowledge Graph

Research and evolving story state live in a per-story SQLite knowledge graph instead of loose
markdown files. The graph is the story's **memory** (what must still be true many chapters later),
not a chronicle of events — `summary.md` is the chronicle. This keeps details searchable and
connected while saving tokens: `write-chapter` loads only the few nodes relevant to a chapter.

- **Nodes** (character, location, faction, item, event, ability, concept, arc, thread) hold
  small metadata; full details live in `graph/nodes/<id>.md`.
- **Edges** capture relationships (family, allegiance, membership, location, causality, etc.).
- **Canonicity** (`canon` / `au` / `original`) tags every node and edge, so fanfiction tracks
  both the real fandom and the alternate-universe changes we deliberately create.
- Everything is managed by the deterministic CLI `.github/scripts/graph.mjs` (nodes, edges,
  search, recap, consolidate, validate, migrate). Deterministic ids plus a consolidation pass make
  duplicates impossible. Run `node .github/scripts/graph.mjs schema` to see the full type list.
- **`recap`** assembles a compact per-chapter briefing in one call — the relevant `focus` nodes,
  their connections, one-hop neighbours, and every open `thread` and `arc` (metadata only, no
  bodies) — so `write-chapter` grounds a chapter fast without loading the whole graph:
  ```
  node .github/scripts/graph.mjs recap --story <slug> --query "people, places, terms" [--ids id1,id2]
  ```

### Brain Viewer

The reader ships an interactive **Brain Viewer** at `/brain/<slug>/` — a force-directed graph
of the story's knowledge, colour-coded by node type and edge type. Click any node to see its
markdown details and connections. Since the reader is a static site, the build takes a
**snapshot** of each graph at publish time (`reader/scripts/build-graph-snapshots.mjs` →
`reader/public/graph/<slug>.json`), so the viewer reflects the graph as of the last deploy.

## Requirements

- **Graph scripts** — Install once so the skills can manage the knowledge graph:
  ```
  cd .github/scripts && npm install
  ```
- **webiq** — Preferred web-research tools (`webiq-mcp`) for fandom research.
- **SearXNG** (fallback) — Used only if webiq is unavailable. The orchestrator can start it via Docker:
  ```
  docker run -d --name searxng -p 8080:8080 searxng/searxng
  ```

## Key Design Decisions

- **Skills, not agents.** Each capability is a skill under `.github/skills/`, auto-invoked by its description and run inline in the conversation so context is never lost to a subagent handoff.
- **Graph = memory, not chronicle.** The graph stores only what must still be true many chapters later (relationships, inventory, world-state, knowledge). A Graph Worthiness Test keeps it small; `event` nodes are reserved for major canon-divergence anchors. Per-chapter history lives in `summary.md`.
- **Canon lock.** For fanfiction, events the protagonist hasn't changed flow like the source; only deliberate divergences differ, tracked as `au` nodes with `diverges_from` edges.
- **Grounded, tracked voice.** Each character's voice is built from verbatim source dialogue and a Voice Evolution log tracks how it legitimately changes over time, so dialogue sounds like the character instead of a generic narrator.
- **Write then de-perfect.** After drafting, the `humanize-prose` pass makes the prose less perfect on purpose — killing the "X, not Y" antithesis tic (the top-priority ban), em dashes, over-detailed fights, and risk-setting monologues, while adding human texture.
- **Wiki-first research.** Fandom wikis are the primary source; `story-setup` crawls individual wiki pages for characters, locations, and systems in full.
- **Sub-event interweaving.** The plan decomposes each key event into sub-events distributed across chapters so 2-3 threads stay live at once, tracked as `thread` nodes.
- **Scene weight system.** Before writing, every scene is classified Heavy / Medium / Light / Skip to protect pacing and keep emotion, not choreography, at the center.
