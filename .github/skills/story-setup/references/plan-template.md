# Plan Template (story-setup)

`plan.md` is both the outline and the continuity control document. Ground everything in the graph
(reference node ids). Keep it high level: describe conflicts and beats, not scene-level prose or
dialogue.

```markdown
# Story Plan: <Story Name>

## Overview
2-3 sentence summary of the whole story.

## Cast
Each character with their role (protagonist, antagonist, mentor, foil, love interest).

## Canon Timeline (Fanfiction)
The load-bearing canon events in order, and the **divergence point** where this story breaks from
canon. Everything before/outside the protagonist's butterfly effect must flow like the source.

## Arc 1: <Arc Name>
### Synopsis
Purpose and events of the arc.
### Setting
Key locations and world context.
### Chapters
- **Chapter 1**: <conflict/event; characters involved; which sub-events/threads it advances or pays off; canon-locked or diverged>
- **Chapter 2**: ...
### Key Events
- ...
### Thread Map
- **Thread A (<name>)**: setup Ch1 -> complication Ch3 -> payoff Ch5
- **Thread B (<name>)**: setup Ch2 -> payoff Ch4
### Character Development
Who grows/changes in this arc and how (mirror major voice shifts into the graph Voice Evolution).
### Arc Shape
- **Immediate goal**: What the protagonist wants and the clever first steps they take.
- **Escalation**: Unexpected obstacles; how overcoming each one brings progress and growth.
- **Catastrophic setback**: What destroys or invalidates most of that progress and makes success seem lost.
- **Costly solution**: The dramatic choice or action that succeeds, and the meaningful price it demands.
- **Changed horizon**: How the protagonist returns changed or becomes poised for a new journey.

## Arc 2: <Arc Name>
...

## Ending
How the story concludes.

## Style Fingerprint (Required)
- Tone and voice profile for this story.
- Paragraph rhythm target: short, mobile-friendly blocks; frequent single-line beats.
- Dialogue cues per major character (point to their grounded voice nodes).
- Punctuation rule: no em dashes; no "X, not Y" antithesis tic.
- 5-8 style anchors from references the user likes.
- Baseline craft reference: the human-written samples in
  `.github/skills/write-chapter/references/samples/`. The writer re-reads them each session.

## Continuity Anchors (Required)
- Non-negotiable facts that must stay true.
- Fixed character-history points that cannot be contradicted.
- Locked world rules (power limits, institutions, timeline constraints).

## Canon Divergence Register (Fanfiction Required)
For each divergence: canon baseline / new lore in this story / first chapter it applies /
required downstream consequences / forbidden callbacks to overwritten canon.

## Important Setup Tracker (Required)
- Details that must pay off later.
- Timeline-sensitive facts (ages, dates, locations, affiliations).
- Character promises/debts/goals to track across arcs.
```

## Sub-event interweaving (required before finalizing chapters)

A plan where chapter 1 = event 1, chapter 2 = event 2 reads flat. Interleave so tension from one
thread carries the reader across the quiet parts of another:

1. **Decompose** each arc's key events into 2-4 sub-events (setup, complication, turn, payoff).
2. **Distribute, don't stack.** Spread sub-events across chapters; keep 2-3 threads live at once.
3. **Respect causality.** A sub-event that depends on another comes after it.
4. **Build suspense across chapters.** End on an unresolved sub-event of one thread; pick up a
   different thread next chapter. Pay off on a schedule, not all at once.
5. **Model threads in the graph** as `thread` nodes; name in each chapter bullet which threads it
   advances or resolves. The writer reads open threads from the graph recap to keep the weave.
