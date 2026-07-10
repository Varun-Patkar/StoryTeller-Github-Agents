# StoryTeller Agents

A set of VS Code / GitHub Copilot agents that write webnovel-style fiction chapter by chapter — fanfiction or original.

## Agents

| Agent | Role |
|-------|------|
| **Storyteller** | Orchestrator. Routes to setup or runner based on intent. Prefers webiq for web research (SearXNG fallback). |
| **Story Setup** | Gathers story preferences, deep-researches the fandom via wiki crawling, builds a story plan. |
| **Story Runner** | Writes one chapter per session. Handles pacing, tone, and post-chapter bookkeeping. |

## How It Works

1. **Say "new story"** → Storyteller routes to Story Setup.
2. Setup asks you questions (type, fandom, genre, themes, mode, pacing).
3. Setup crawls the fandom wiki (fandom.com) for deep research — characters, world, power systems, quotes, speech patterns.
4. Setup generates a full story plan with arcs, chapter outlines, and interwoven sub-event threads (so multiple storylines stay live at once instead of one event per chapter).
5. **Say "next chapter"** → Storyteller routes to Story Runner.
6. Runner pulls a compact graph briefing (relevant nodes + open threads), writes the next chapter, then self-critiques and revises it against the outline, canon, and style rules before saving.
7. You approve or request a rewrite. Repeat.

## Story Modes

- **Companion Writer** (default) — You write the first draft of each chapter; the agent refines it and fills only the sections you mark, acting as a co-writer and live knowledge base. All creativity stays with you.
- **Here for the Ride** — Continuous storytelling. The agent writes each chapter from the plan; you approve or request rewrites.
- **Interactive** — Each chapter ends on a decision point. You pick what happens next.

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
markdown files. This keeps details searchable and connected while saving tokens: the agents
load only the few nodes relevant to a chapter.

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
  bodies) — so the runner grounds a chapter fast without loading the whole graph:
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

- **Graph scripts** — Install once so the agents can manage the knowledge graph:
  ```
  cd .github/scripts && npm install
  ```
- **webiq** — Preferred web-research tools (`webiq-mcp`) for fandom research.
- **SearXNG** (fallback) — Used only if webiq is unavailable. The orchestrator can start it via Docker:
  ```
  docker run -d --name searxng -p 8080:8080 searxng/searxng
  ```

## Key Design Decisions

- **Wiki-first research.** Fandom wikis are the primary source, not general internet searches. The setup agent crawls individual wiki pages for characters, locations, and systems in full.
- **Sub-event interweaving.** The plan decomposes each key event into sub-events and distributes them across chapters so 2-3 storyline threads stay live at once, building cross-chapter suspense instead of resolving one event per chapter. Threads are tracked as `thread` nodes in the graph.
- **Critic & revision pass.** Before saving, the runner self-critiques each draft against the outline, continuity/canon, character voice, and anti-slop rules, classifies issues as RE-WRITE / POLISH / OK, and iterates until zero deviations and zero em dashes remain.
- **Compact graph briefing.** The runner grounds each chapter from a single `recap` call (relevant nodes + open threads) rather than loading every research file, keeping context tight.
- **Scene weight system.** Before writing, the runner classifies every scene as Heavy / Medium / Light / Skip to avoid the "everything sounds the same" problem.
- **Tonal variation.** Not every scene is dramatic. Chapters decompress after big moments, let characters be bored, and include throwaway details that make prose feel human.
- **Character voice files.** Each character node records exact quotes and speech patterns so dialogue doesn't sound generic.
- **Strict anti-AI-slop rules.** Banned word lists, banned sentence patterns, and structural variety requirements to keep prose from reading like default LLM output.
