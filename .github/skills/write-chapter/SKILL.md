---
name: write-chapter
description: "Write or rewrite the next chapter of an existing story in books/<slug>/, end to end. USE FOR: 'next chapter', 'continue the story', 'run a session', 'write chapter N', 'rewrite this chapter', or continuing any story that already has config.md + plan.md. Runs the full pipeline: load memory from the graph, lock to canon, blueprint scene weights, draft, gate character voice, self-critique, humanize (de-perfect), save, then update memory (summary chronicle + graph memory-diff). One session = one chapter. Keywords: next chapter, continue story, write chapter, story session, rewrite chapter."
---

# Write Chapter

One session writes exactly **one** chapter. The job is a natural, human-sounding chapter that
fits the plan, stays true to canon, sounds like its characters, and leaves the story's memory
updated. This runs inline (no subagents) so context is preserved end to end.

Before drafting, skim the gold-standard samples in
[references/samples](./references/samples/) to re-anchor the target voice. Do this every session.

## Stage 0 — Preflight (load the story)

1. Read `books/<slug>/config.md` (mode, pacing, POV, tone, type/fandom).
2. Read `plan.md`; find the next chapter and the beats/threads it owes. If the plan is exhausted,
   tell the user the planned story is complete and ask whether to extend or conclude. Stop.
3. Read `summary.md` (the chronicle of what has happened).
4. Check `chapters/` for the last written number.
5. If any of config/plan/summary is missing, the story isn't set up: point the user to
   `story-setup` and stop.
6. **Companion Writer mode:** the human's draft at `human-drafts/chapter-XX.md` is the source of
   truth. Read it in full. Do not author from the plan; only refine and fill marked/bracketed
   gaps. If it's missing/empty, ask the human to write it. (See Stage 8.)

## Stage 1 — Load memory (graph)

The graph is the story's MEMORY: the small set of facts that must still be true now. Do not read
every node. Pull only what this chapter needs, via `.github/scripts/graph.mjs`:

- `node .github/scripts/graph.mjs recap --story <slug> --query "<people, places, terms in this chapter>"`
  returns focus nodes + connections + one-hop neighbors + open `thread`s + `arc`s. This is your
  grounding call and the fix for "read recap then ignore the graph": you will act on it in Stage 1,
  4, and 10.
- `get-node --story <slug> --id <id>` for each character/location/concept the recap surfaces that
  actually appears. Only pull bodies you need.
- `neighbors --story <slug> --id <id> --depth 1` to go deeper on a specific node.

Respect **canonicity** on every node: `canon` = source truth, `au` = an established divergence you
must honor, `original` = invented for this story. Read each node's Canon and AU Divergence sections
so you never contradict a locked fact or an established change.

## Stage 2 — Canon lock (fanfiction)

This fixes the biggest complaint: un-butterflied events drifting away from the source.

1. Identify what this chapter touches. For each canon event/character/place involved, decide:
   **has the protagonist actually changed this yet?**
2. If **no** (outside the butterfly effect so far): it must flow like canon. Match the source's
   beats, outcomes, and order. Pull the canon node (and web-verify via webiq if the node is thin)
   rather than improvising a new version.
3. If **yes** (the protagonist has diverged it): follow the established `au` nodes and the plan's
   Canon Divergence Register. Stay consistent with prior divergences; do not silently re-invent.
4. Keep a short visible **canon checklist** for the chapter: which beats are locked-to-canon and
   which are diverged. Honor it while drafting and again in the critic pass.

## Stage 3 — Voice prep

For every character who will speak, pull their node and read **Voice & Mannerisms** (Baseline +
Source Quotes + current Voice Evolution). If a lead has no grounded profile yet, or the profile is
thin, run the `character-voice` skill to build/refresh it from real source dialogue before drafting.

## Stage 4 — Scene blueprint (output this before writing)

Decide each scene's **weight**. This is what stops "everything sounds the same" and protects pacing.

| Weight | Meaning | How to write it |
| --- | --- | --- |
| **Heavy** | A pivotal beat: reveal, first meeting, a fight that matters, an emotional turn. | Slow down, let it breathe, multiple paragraphs. |
| **Medium** | Moves plot: purposeful conversation, setup, travel with intent. | A few paragraphs. |
| **Light** | Transition, routine, A-to-B. | 1-3 sentences. Summarize hard. |
| **Skip** | Nothing the reader needs. | Don't write it. Jump ahead. |

Target roughly: 1-2 Heavy, 2-3 Medium, 1-2 Light, rest skipped. **The emotional beats are the
meat** — weight them Heavy and give fights the space they actually deserve (usually Light/Medium,
rarely Heavy). If pacing (Stage 6) can't fit everything, cut Medium/Light scenes first.

Output the blueprint visibly: a short list of scenes with their weight and one line each.

## Stage 5 — Draft

Write into `chapters/chapter-XX.md` (zero-padded) with the format:

```markdown
# Chapter <N>: <Title>

<content>
```

Follow the `writing-style` rules (auto-attached to chapter files) and the samples. In short:
third person clean narration with personality, short paragraphs, contractions, varied sentence
length, emotion carried by concrete moments, canon woven in quietly, brief combat, real character
voices. Open and close differently from the previous chapter.

## Stage 6 — Pacing

Respect `config.md` pacing:

| Setting | Words |
| --- | --- |
| Short | 1,000-1,500 |
| Medium | 1,500-3,000 (default) |
| Long | 3,000-5,000 |
| Epic | 5,000+ |

If under the minimum, deepen existing scenes or add a beat rather than padding with scenery.
Never pad with banned filler or add a redundant scene only to reach a number. A prologue or
epilogue may finish below the configured minimum when its planned content is complete and the
independent AI-ness reviewer identifies length-driven over-explanation or artificial expansion.
Record the intentional exception in the session result.

## Stage 7 — Five review passes (before saving)

Run these in order on the draft. Iterate until clean.

1. **Critic pass** — adversarially audit against:
   - *Outline fidelity*: covers the plan's beats for this chapter; no drift into later chapters, no
     invented plot. Flag deviations.
   - *Continuity & canon*: cross-check the Stage-2 canon checklist and the `canon`/`au` nodes. Flag
     contradicted facts, violated locks, forbidden callbacks to overwritten canon.
   - *Character voice*: run the Stage-3 voice gate (the `character-voice` skill). Rewrite off-voice
     lines.
   Classify each flag: RE-WRITE (must fix), POLISH (fix in place), OK (false alarm). Fix all
   RE-WRITE and POLISH. Repeat until zero RE-WRITE issues.
2. **Humanize pass** — run the `humanize-prose` skill on the draft. Zero tolerance for the
   "X, not Y" antithesis tic and em dashes; add human unevenness; deflate any over-detailed fight
   or risk-setting; make sure there's room to breathe (chill beats).
3. **Independent AI-ness review** — delegate the finished draft to a fresh subagent that did not
  draft or revise it. Give it the chapter plus the anti-slop criteria and ask for an adversarial
  review only; it must not edit. The reviewer must look beyond word bans for deeper generation
  tells: polished aphorism density, rhetorical symmetry, repeated sentence templates,
  meta-narrator self-explanation, redundant emotional interpretation, fake specificity,
  trailer-ready imagery, immaculate motif callbacks, and an emotional arc that closes too
  perfectly. Require quoted passages and severity-ranked findings. Never perform this gate as
  self-review. If subagents are unavailable, stop and tell the user the mandatory independent
  gate could not run.
4. **De-polish pass** — use the independent findings to make the prose less composed and more
  lived-in. Cut explanations the action already carries, most quotable capstone lines, repeated
  rhetorical machinery, and overly complete callbacks. Prefer mundane specifics, imperfect or
  unfinished thoughts, irrelevant observations, small misreadings, and unresolved texture.
  Cutting is preferred to replacement. Preserve plot, canon, character, voice, and logical
  behavior. Human unevenness belongs in cadence, phrasing, attention, and incomplete thoughts;
  never add irrational actions, forced quirkiness, implausible dialogue, or deliberate grammar
  and spelling errors as proof of humanity. Do not restore material merely to recover the
  configured word count; natural length outranks padding.
5. **Final read** — read it once as a reader after de-polishing. If you skim anywhere, cut or fix
  that part. Confirm every independent RE-WRITE/POLISH finding was addressed or explicitly
  rejected with a concrete reason.

Only after all five passes: save the file.

## Stage 8 — Mode-specific finish

- **Here for the Ride** (default): present the chapter, ask "keep this or rewrite?" On rewrite,
  ask what to change and overwrite the same file.
- **Interactive**: end on a real decision point; present 2-4 options plus a custom option via
  `vscode_askQuestions` (or numbered list if unavailable) and STOP until the user chooses.
- **Companion Writer**: source of truth is the human's draft. Preserve their prose (only grammar,
  rhythm, em-dash and antithesis fixes that don't change meaning); write only bracketed/marked
  gaps in their voice; never add plot/characters/worldbuilding they didn't write; surface
  continuity/voice concerns as suggestions, not silent edits. Then present the finished chapter.

## Stage 9 — Update memory (after the chapter)

Two different things get updated. Do not conflate them.

### 9a. Chronicle → `summary.md`
Add a 1-2 sentence summary of the new chapter under the right arc. Cumulative. This is where
"what happened" lives. Condense old arcs to a paragraph if it grows past ~50 lines.

### 9b. Memory diff → the graph
The graph is memory, not a log. After the chapter, ask: **what is permanently different now?**
Emit a small diff and apply only that. See the graph = memory rules in
`story-files.instructions.md` and follow the **Graph Worthiness Test** there.

**Default to adding nothing.** Most chapters change the graph by zero or one node. A dense graph
is a cost: it slows every future recap and buries the facts that matter. Prefer updating an
existing node over creating a new one; prefer a line in `summary.md` over either. Only spend a new
node when a genuinely new standing entity enters the story. In short:

- Add/update a node ONLY for a change that must still be true many chapters later: a new standing
  character/location/faction/item/ability/concept, a permanent relationship shift, gained/lost
  inventory, changed world-state, unlocked plot, or something a character now permanently knows.
- Do **not** create a node for one-off actions, travel, scenery, passing emotions, or "stuff that
  happened this chapter". Those live in `summary.md`, not the graph.
- The one exception for `event` nodes: a **major canon-divergence event** that later chapters must
  anchor to. Give it a node and a `diverges_from` edge; note it in the plan's Canon Divergence
  Register.
- Update character **Voice Evolution** if a voice permanently shifted this chapter.
- New nodes get edges (no orphans). Then run `consolidate --story <slug>`, merge true duplicates,
  and `validate --story <slug>` until `"ok": true`.

### 9c. Plan alignment + continuity audit
Compare what was written to `plan.md`; update the plan if the story moved. Update the Important
Setup Tracker with new promises/debts/reveals. If you find a contradiction, fix the chapter text
first, then align `summary.md`, `plan.md`, and the graph.

## Stage 10 — Session end

Tell the user: what chapter was written, a one-line teaser of what's next (from the plan), and
that they can start another session to continue.

## Constraints

- One chapter per session. Respect pacing. Respect the mode.
- Never edit `graph.db` or node markdown by hand — always `graph.mjs`.
- **Keep the graph small.** Store only what must still be true many chapters later. Default to
  adding no nodes; most chapters add zero or one. Prefer updating an existing node over adding one,
  and a line in `summary.md` over either. A fact that fits an existing node body or the chronicle
  does not get its own node. Never node-ify one-off actions, travel, scenery, or passing beats.
  Merge duplicates on sight and keep the graph dense in edges, lean in nodes.
- Never save a chapter that still has a "X, not Y" antithesis, an em dash, or an unresolved
  RE-WRITE flag.
- Always output the scene blueprint before drafting.
- Always update summary.md (chronicle) and the graph (memory diff) after writing.
