# StoryTeller Agents — Copilot Instructions

## Project Overview

Two-part project: VS Code/Copilot **agents** that write webnovel-style fiction, and a static **reader** site for browsing the published stories.

- Agents: `.github/agents/` — three-agent system (storyteller, story-setup, story-runner)
- Reader: `reader/` — Astro static site that reads `books/` at build time
- Stories: `books/<slug>/` — file-system story storage; research/state in a per-story knowledge graph

See [README.md](../README.md) for architecture, agent roles, and story modes.

## Commands

```bash
# Reader (static site)
cd reader
npm install
npm run dev      # Dev server
npm run build    # Static build

# Graph / scaffolding scripts (run once to install deps)
cd .github/scripts
npm install      # installs better-sqlite3

# Web research for agents prefers webiq (webiq-mcp tools).
# SearXNG is only a fallback if webiq is unavailable:
docker run -d --name searxng -p 8080:8080 searxng/searxng
```

## Story Structure

Each story lives at `books/<slug>/` with this layout:

```
books/<slug>/
├── config.md          # Markdown table of settings (parsed by reader/src/lib/books.ts)
├── plan.md            # Arc-by-arc chapter outline (references graph node ids)
├── summary.md         # Running chapter summaries
├── chapters/chapter-01.md ...
└── graph/             # Per-story knowledge graph (research + story state)
    ├── graph.db       # SQLite: nodes + edges
    └── nodes/<id>.md  # One markdown body per node
```

## Knowledge Graph

Story research and evolving state live in a per-story SQLite graph, never in loose files.

- **Access only via** `.github/scripts/graph.mjs` (a CLI; agents cannot run raw SQL). Run `node .github/scripts/graph.mjs schema` for the allowed types.
- **Nodes** hold small metadata (id, type, name, canonicity, aliases, summary, tags); full details live in `graph/nodes/<id>.md`.
- **Node types**: character, location, faction, item, event, ability, concept, arc, thread.
- **Edge types**: family_of, ally_of, enemy_of, knows, member_of, located_in, owns, has_ability, occurs_in, involves, causes, precedes, part_of, related_to, diverges_from.
- **Canonicity** (`canon` | `au` | `original`) tags every node/edge so fanfics track both source-fandom truth and our alternate-universe divergences. Each node body has Canon and AU Divergence sections.
- Deterministic ids (`<type>-<slug>`) + UNIQUE constraints make duplicates impossible; `consolidate` catches near-duplicates and `validate` checks integrity.
- `recap --story <slug> --query "..." [--ids ...]` returns a compact per-chapter briefing (focus nodes + connections + open threads + arcs, metadata only) — the story-runner's primary grounding call.
- Engine modules live in `.github/scripts/graph/` (db, nodes, edges, search, consolidate, migrate).

## Reader Conventions

- **Framework**: Astro static site (`reader/`), builds from `books/` at compile time.
- **No database, no server**: `reader/src/lib/books.ts` reads config/chapters/covers from the file system.
- **Slugs**: kebab-case story folder names are used as URL segments.
- The reader displays chapters and config, plus a **Brain Viewer** of the knowledge graph.

## Brain Viewer (graph snapshot)

The reader includes an interactive graph viewer at `/brain/<slug>/` ([BrainViewer.astro](../reader/src/components/BrainViewer.astro)).

- Because the reader is a static frontend (no live DB/git access), the build takes a **snapshot** of each story graph. `reader/scripts/build-graph-snapshots.mjs` (a prebuild step) reads each `graph/graph.db` + node markdown, pre-renders bodies with `marked`, and writes `reader/public/graph/<slug>.json`.
- The viewer is self-contained (canvas force-directed graph, no external library): nodes colour-coded by type, edges by type (AU edges dashed), click a node for its markdown details + connections.
- Reader depends on `better-sqlite3` (build-time) to read the graph snapshots.

## Agent Conventions

- Agents are defined in `.github/agents/*.agent.md` (storyteller orchestrator + story-setup + story-runner).
- Web research prefers **webiq** (`webiq-mcp` tools); SearXNG then Playwright are fallbacks.
- Story scaffolding is deterministic via `.github/scripts/create-story-structure.mjs`.
- The graph is read/written by both story-setup (research) and story-runner (per-chapter state) via `graph.mjs`.

## Writing Rules (for agent prompt editing)

The agents enforce strict anti-AI-slop rules. When editing agent prompts:
- Maintain the banned words/phrases lists
- Preserve the scene weight system (Heavy/Medium/Light/Skip)
- Keep character voice requirements (quotes + speech patterns) in character node bodies
- Don't weaken tonal variation rules

## Key Files

| File | Purpose |
|------|---------|
| `.github/agents/storyteller.agent.md` | Orchestrator agent prompt |
| `.github/agents/story-setup.agent.md` | Research + planning agent prompt |
| `.github/agents/story-runner.agent.md` | Chapter-writing agent prompt |
| `.github/scripts/graph.mjs` | Knowledge-graph CLI (nodes/edges/search/consolidate/migrate) |
| `.github/scripts/graph/db.mjs` | Schema + allowed node/edge/canonicity enums (source of truth) |
| `.github/scripts/create-story-structure.mjs` | Deterministic story scaffolding |
| `reader/src/lib/books.ts` | Reader story/chapter/config reads (file-system) |
