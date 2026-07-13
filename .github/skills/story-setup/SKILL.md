---
name: story-setup
description: "Set up a NEW story from an idea or plot starter: run the questionnaire, research the fandom/genre deeply, build the story's memory graph, and write the plan. USE FOR: 'new story', 'create a story', 'start a story', 'write me a story about…', 'set up a book', story planning, worldbuilding, fanfiction setup. Produces books/<slug>/ with config.md, plan.md, an empty summary.md, and a dense, canon-grounded knowledge graph. Keywords: new story, create story, story setup, questionnaire, worldbuilding, canon research, fanfiction setup, book plan."
---

# Story Setup

Turn a plot idea into a ready-to-write story: gather intent, research the source until you could
pass for a fan, build the story's memory graph, and write a plan. You do NOT write chapters here.

The user is the idea person and wants to read the story fresh. So build a solid foundation, but do
not over-explain the whole story back to them; a short confirmation is enough.

## Phase 1 — Core questions

Ask all at once via `vscode_askQuestions` (if unavailable, print them and stop):

1. **Story Type**: `Fanfiction` / `Original Fiction`
2. **Fandom** (if Fanfiction): free text.
3. **Genre** (multi-select + custom): Fantasy, Sci-Fi, Romance, Horror, Thriller, Mystery,
   Adventure, Slice of Life, Comedy, Tragedy, Action, Drama.
4. **Themes**: free text.
5. **Story Mode**: `Here for the Ride` (default) / `Interactive` / `Companion Writer`. Only these three.
6. **Pacing**: Short (1000-1500) / Medium (1500-3000, default) / Long (3000-5000) / Epic (5000+).

## Phase 2 — Follow-ups (tailored, optional)

Ask a second round relevant to the choices (each allows free text): plot direction/route; lead
characters (fanfiction); supporting characters; POV (First / Third Limited / Third Omniscient);
tone (Lighthearted / Dark / Balanced / Gritty / Whimsical); setting tweaks; power/magic system.
For fanfiction, also ask the **divergence point**: where does this story break from canon, and what
is the protagonist's starting situation? Everything before/outside that point flows like the source.

## Phase 3 — Name

Suggest 3-5 names from the gathered info. Iterate until the user confirms one.

## Phase 4 — Research (the part that makes or breaks a fanfic)

Research prefers **webiq** (`mcp_web_iq_mcp_se_web` to search → `mcp_web_iq_mcp_se_browse` to
read); fall back to SearXNG (`searxng` search + `fetch_webpage`) then Playwright. A single search
is never enough. Full detail and the self-check are in [references/research.md](./references/research.md).

Scope:
- **Fanfiction / anything referencing an existing work:** full research (wiki crawl → characters →
  world/systems → supplementary). Build a **canon timeline** so the plan knows what un-butterflied
  events must look like.
- **Original fiction in an established genre** (xianxia, LitRPG, etc.): research genre conventions only.
- **Fully original world:** skip research; define the rules yourself.

Two research outputs matter most:
1. **Canon truth** for every relevant character, place, faction, item, system, and event.
2. **Grounded voice.** For each lead (and each notable speaker), pull the character's **actual
   dialogue/quotes** from the source using the `character-voice` skill, and store them in the
   character node. This is how the story avoids everyone sounding like the same narrator.

## Phase 5 — Build the memory graph

Scaffold the story first (Phase 6 command), then populate the graph via
`.github/scripts/graph.mjs` (run `graph.mjs schema` for allowed types; never edit the db/markdown
by hand). Follow the graph = memory model in `story-files.instructions.md`.

At setup, the graph holds the **standing world**: the entities and relationships that exist before
chapter 1. Density rules:

- **One node per distinct entity.** Every named character, place, faction, item, ability, and
  concept gets its OWN node. Never lump ("supporting cast", "world building").
- **Model the spine:** an `arc` node per planned arc; `thread` nodes for setups/promises to pay off.
- **Canon events at setup:** create `event` nodes only for the load-bearing canon events the plan
  reasons about (the timeline anchors) and for planned major divergences. Not for every incident.
- **Canonicity** on every node/edge: `canon` (source truth), `au` (a deliberate divergence),
  `original` (invented). Each canon character node's **Voice & Mannerisms** must be grounded in
  real source quotes (Phase 4). Each AU node gets a `diverges_from` edge to the canon baseline.
- **Connect everything** — no orphan nodes; expect at least as many edges as nodes.

Node body sections: Overview, Canon, AU Divergence, and (characters) Voice & Mannerisms.
Add nodes with `add-node ... --body-file <temp.md>`, edges with `add-edge`. Then `consolidate`,
merge duplicates, and `validate` until `"ok": true`.

## Phase 6 — Scaffold + plan

Create the folder deterministically (do NOT hand-create config/summary/graph):

```bash
node .github/scripts/create-story-structure.mjs "<Story Name>" --type "<Type>" --fandom "<Fandom>" \
  --genre "<Genres>" --themes "<Themes>" --mode "<Mode>" --pacing "<Pacing>" --pov "<POV>" --tone "<Tone>"
```

Then:
1. Write `plan.md` using [references/plan-template.md](./references/plan-template.md). Ground every
   arc/chapter in the graph (reference node ids). For fanfiction, fill the Canon Divergence
   Register and mark which early chapters are canon-locked vs diverged.
2. Fill `config.md`: Synopsis (2-3 sentences), Cover Prompt (detailed image prompt with title at
   top / author at bottom; author from the `Author` field or `git config user.name`), Total Chapters.
3. Confirm the graph is dense, grounded, and `validate` passes.
4. Tell the user setup is complete and they can start a session (`write-chapter`).

## Constraints

- Do NOT write chapters. Do NOT skip research for fanfiction/established genres.
- Do NOT rely on your own memory for canon — verify via web research.
- Do NOT write vague nodes or lump entities. Keep the graph dense and connected.
- Stop and wait for the user after each question round if `vscode_askQuestions` is unavailable.
- Present a short research summary and get confirmation before writing the plan.
