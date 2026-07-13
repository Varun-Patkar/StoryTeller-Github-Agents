# Research Process (story-setup)

Depth here is what makes a fanfiction feel real. A shallow research phase produces a shallow story
where characters sound generic and un-butterflied events drift from canon. Do multiple rounds.

Research prefers **webiq** (`mcp_web_iq_mcp_se_web` to search → `mcp_web_iq_mcp_se_browse` to read).
Fallbacks: SearXNG (`searxng` search + `fetch_webpage`), then Playwright (`open_browser_page` →
Google, `read_page`). A single search is never enough.

## Step 0 — Find the fandom wiki (most important)

The fandom's dedicated wiki is the primary source of truth, above general searches.

1. Search `"<fandom> fandom.com wiki"`, `"<fandom> wiki"`.
2. Prefer `<fandom>.fandom.com`. Load its main page and map its structure (character lists,
   location lists, terminology, arc/timeline pages).
3. If none, look for other dedicated wikis, then Wikipedia.
4. If sources are thin (obscure fandom), tell the user what you found, ask for reference
   material/links, and tag anything from memory as `[UNVERIFIED]`.
5. Record the wiki base URL; you'll fetch many pages from it.

## Step 1 — Overview & timeline

Fetch the series overview, plot/arc summaries, and the timeline/chronology. For each relevant arc,
read the full plot summary. Build a **canon timeline** of load-bearing events with rough order.
This timeline is what the plan uses to keep un-butterflied events flowing like the source.

## Step 2 — Characters (deep)

For every relevant character (user's leads + major canon characters), fetch their full wiki page
and read all of it: background, personality, abilities (with exact named techniques/ranks),
relationships (the arc of how they relate, not just that they do), appearance, **notable quotes**,
trivia. For minor characters who will appear, at least name, role, relationship, traits, and how
they talk.

**Voice grounding (required):** for each lead and notable speaker, collect **verbatim dialogue**
from the source (wiki Quotes section, transcripts, subtitle dumps, gameplay/let's-play transcripts).
Hand these to the `character-voice` skill so the character node's Voice & Mannerisms is built from
real lines, not memory. You should be able to imagine how each character reacts to a novel
situation using only your notes; if you can't, dig more.

## Step 3 — World & systems

Fetch dedicated pages for geography/locations, factions/organizations/politics, the power/magic/
tech system (the full page), cultural norms/ranks/titles/terminology, and important items. For
power-system genres, document the full progression ladder with exact rank names, named techniques,
combat mechanics, resources, and limits.

## Step 4 — Supplementary search

Now fill gaps with general search: genre writing guides, tropes, common plot structures, fandom
discussions of character dynamics and popular interpretations, common fanfic tropes (to use or
avoid deliberately), expected pacing, reader expectations, pitfalls.

## Step 5 — Write into the graph

Follow story-setup Phase 5 and the graph = memory model in `story-files.instructions.md`. Split
research into typed nodes (one per entity), ground voices in real quotes, connect everything, tag
canonicity, add `diverges_from` for AU, then `consolidate` + `validate`.

## Step 6 — Self-verification (output PASS/FAIL; if any FAIL, go back to the wiki)

- [ ] Every major character described with 3+ real quotes/speech patterns and specific named abilities.
- [ ] Power/magic system understood well enough to write a scene using a named technique.
- [ ] Key locations, structures, and genre terms known with specifics (names, ranks, terms).
- [ ] Relationships detailed enough to write believable interactions (HOW, not just THAT).
- [ ] Canon plot known well enough to diverge intentionally; a source fan would find no errors in the nodes.
- [ ] A canon timeline exists so the plan can keep un-butterflied events matching the source.
- [ ] Every lead/notable speaker's voice is grounded in verbatim source dialogue.
- [ ] Every node tagged with canonicity; every AU change has a `diverges_from` edge.
- [ ] Graph is dense: one node per entity, an `arc` node per arc, no orphans, edges ≥ nodes.
- [ ] `consolidate` shows no unresolved duplicates; `validate` returns `"ok": true`.

Depth matters more than speed. If any answer is no, fetch more pages before writing the plan.
