# StoryTeller Agents

A set of VS Code / GitHub Copilot agents that write webnovel-style fiction chapter by chapter — fanfiction or original.

## Agents

| Agent | Role |
|-------|------|
| **Storyteller** | Orchestrator. Routes to setup or runner based on intent. Ensures SearXNG is running. |
| **Story Setup** | Gathers story preferences, deep-researches the fandom via wiki crawling, builds a story plan. |
| **Story Runner** | Writes one chapter per session. Handles pacing, tone, and post-chapter bookkeeping. |

## How It Works

1. **Say "new story"** → Storyteller routes to Story Setup.
2. Setup asks you questions (type, fandom, genre, themes, mode, pacing).
3. Setup crawls the fandom wiki (fandom.com) for deep research — characters, world, power systems, quotes, speech patterns.
4. Setup generates a full story plan with arcs and chapter outlines.
5. **Say "next chapter"** → Storyteller routes to Story Runner.
6. Runner reads the plan, summary, and research, then writes the next chapter.
7. You approve or request a rewrite. Repeat.

## Story Modes

- **Here for the Ride** (default) — Continuous storytelling. You read, approve or request rewrites.
- **Interactive** — Each chapter ends on a decision point. You pick what happens next.

## Project Structure

Each story gets its own folder at the workspace root:

```
<story-name>/
├── config.md          # Story settings
├── plan.md            # Arc-by-arc outline
├── summary.md         # Running chapter summaries
├── chapters/          # Written chapters
│   ├── chapter-01.md
│   └── ...
└── research/          # Fandom/genre research
    ├── fandom-overview.md
    ├── world-building.md
    ├── power-system.md
    ├── genre-conventions.md
    └── characters/
        ├── <character>.md
        └── supporting-cast.md
```

## Requirements

- **SearXNG** — Required for fandom research. The orchestrator will try to start it via Docker automatically.
  ```
  docker run -d --name searxng -p 8080:8080 searxng/searxng
  ```
- **SearXNG MCP tools** — The agents use `searxng/search` and `searxng/fetch_page` for web research.

## Key Design Decisions

- **Wiki-first research.** Fandom wikis are the primary source, not general internet searches. The setup agent crawls individual wiki pages for characters, locations, and systems in full.
- **Scene weight system.** Before writing, the runner classifies every scene as Heavy / Medium / Light / Skip to avoid the "everything sounds the same" problem.
- **Tonal variation.** Not every scene is dramatic. Chapters decompress after big moments, let characters be bored, and include throwaway details that make prose feel human.
- **Character voice files.** Research includes exact quotes and speech patterns per character so dialogue doesn't sound generic.
- **Strict anti-AI-slop rules.** Banned word lists, banned sentence patterns, and structural variety requirements to keep prose from reading like default LLM output.
