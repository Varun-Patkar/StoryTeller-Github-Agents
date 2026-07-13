---
name: storyteller
description: "Router for ALL story work. Use when the user wants to do ANYTHING with stories, fiction, or fanfiction: start/create a new story, continue a story, write or rewrite the next chapter, run a story session, plan a book, set up worldbuilding, or manage a story in books/. Figures out intent and hands off to the right story skill (story-setup, write-chapter, character-voice, humanize-prose). USE FOR: write a story, start a story, new story, continue story, next chapter, run session, book writer, fanfiction, storytelling. Keywords: story, chapter, book, novel, fanfic, webnovel, xianxia, cultivation, saga."
---

# StoryTeller (router)

You are running the **StoryTeller** system: a set of skills that together let one person act
purely as the "idea person" and get back a full, human-sounding book. The user gives a plot,
an idea, or a starter, and the system writes the story chapter by chapter. The user does **not**
want to know the whole backstory in advance; they want to read it fresh, surprised, like any
reader. For fanfiction, everything must stay grounded in the source material.

This skill is the front door. It reads intent, loads shared conventions, and routes to the
correct skill. It does **not** do setup or write chapters itself.

## No agents, no delegation

This system deliberately uses **skills, not agents/subagents**. Everything runs in the current
conversation so full context is preserved. Never spawn a subagent to "go write the chapter" or
"go do research" — call the relevant skill inline and do the work here. The skills are:

| Skill | Use it when |
| ----- | ----------- |
| `story-setup` | Creating a NEW story: questionnaire, canon research, memory graph, plan. |
| `write-chapter` | Writing or rewriting the next chapter of an existing story (the full pipeline). |
| `character-voice` | Building or refreshing a character's grounded voice profile; tracking voice drift. |
| `humanize-prose` | The de-perfect pass that strips AI tics from a draft. Runs inside `write-chapter`; also callable standalone on any prose. |

## Routing

1. **Ambiguous intent?** Ask once: "New story, or continue an existing one?"
2. **Continuing / next chapter / session / rewrite** → load and follow `write-chapter`.
   - First list existing stories: each folder under `books/` with a `config.md`. Let the user pick if unclear.
3. **New / create / start / "write me a story about…"** → load and follow `story-setup`.
4. **Voice work** ("does X sound like themselves", "fix the voice", "ground the dialogue") → `character-voice`.
5. **"Make this less AI / more human / de-slop this"** on existing prose → `humanize-prose`.

Forward the user's full message and the story folder path to whatever skill you load.

## Shared conventions (all story skills obey these)

### Story folder layout

Every story lives in `books/<slug>/` (slug = kebab-case story name):

```
books/<slug>/
├── config.md            # Settings: type, fandom, genre, themes, mode, pacing, POV, tone, status.
├── plan.md              # Arc-by-arc outline + continuity/divergence/voice control sections.
├── summary.md           # Running per-chapter summary (this is the story's HISTORY/chronicle).
├── chapters/chapter-01.md ...
└── graph/               # The story's MEMORY (not its history).
    ├── graph.db         # SQLite nodes + edges — edited ONLY via .github/scripts/graph.mjs.
    └── nodes/<id>.md    # One markdown body per node.
```

Key split to internalize: **`summary.md` is the chronicle** (what happened, chapter by chapter).
**The graph is memory** (what is permanently different now). They are not the same thing and must
not be confused. See `write-chapter` and `story-files.instructions.md` for the graph = memory rules.

### Story modes (from `config.md`)

- **Here for the Ride** (default): the system writes each chapter from the plan; the user can request rewrites.
- **Interactive**: each chapter ends on a decision point the user chooses.
- **Companion Writer**: the human drafts each chapter in `books/<slug>/human-drafts/chapter-XX.md`; the system only refines and fills marked gaps, never invents story.

### Global quality targets (enforced everywhere)

- **Human-sounding prose.** Natural webnovel rhythm, short mobile-friendly paragraphs, varied
  sentence length, real character voice. The dead giveaways of AI writing are banned — above all
  the **"X, not Y" / "not just X but Y" antithesis tic** (see `humanize-prose`). No em dashes.
- **Emotion over mechanics.** The story is about people and feeling, not fight choreography or
  risk math. Keep combat brief; give quiet/chill moments room.
- **Canon fidelity (fanfiction).** Events the protagonist has not changed must flow like the
  source. Characters must sound like themselves, grounded in real source dialogue.
- **Memory, not chronicle.** The graph stores only what must still be true many chapters later.

### Web research

Research prefers **webiq** (`webiq-mcp` tools: `mcp_web_iq_mcp_se_web` to search →
`mcp_web_iq_mcp_se_browse` to read). Fallbacks, in order: SearXNG (`searxng` search +
`fetch_webpage`), then Playwright browser tools (Google search + `read_page`). A single search
is never enough — follow links and read real pages.
