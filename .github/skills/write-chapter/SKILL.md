---
name: write-chapter
description: "Write the next chapter of an existing story. Keep it grounded, readable, and true to the plan."
---

# Write chapter

Write one chapter at a time. The goal is a clean story beat that fits the plan, sounds like the characters, and reads naturally.

## Before drafting

1. Read config.md, plan.md, and summary.md.
2. Confirm plan.md contains `Status: Approved`. If the plan is missing, marked Draft, or has not been explicitly approved by the user, stop and return to story-setup.
3. Check the last chapter number and decide where the next beat belongs.
4. Pull only the graph details needed for this chapter.
5. Make sure the chapter stays true to canon or clearly diverges when the story has changed.

## Voice and scene plan

Before writing, decide:

- who is in the scene
- what is happening
- what matters emotionally
- what can be summarized instead of expanded

Use a simple scene plan:

- Heavy: major reveal, emotional turn, a meaningful confrontation
- Medium: plot progress or dialogue with purpose
- Light: transition or simple movement between beats
- Skip: anything the reader does not need

Keep the emotional beats central. Do not over-choreograph a fight or explain every risk.

## Drafting

Write into chapters/chapter-XX.md in a clear chapter format. Keep narration lively but grounded. Use short paragraphs, varied sentence length, and character-specific language.

Check as you draft:

- Does the chapter follow the plan?
- Does each character sound like themselves?
- Is the emotional beat clear?
- Does the scene stay focused?
- Is the prose natural and readable?

## Editing pass

After the first draft, look for the obvious issues:

- logic problems
- continuity issues
- weak or generic lines
- flat dialogue
- narration that feels too polished or too mechanical
- overexplaining instead of showing

Rewrite anything that breaks the story or the voice.

## Final pass

Before saving, do a final read for flow. Make sure:

- the chapter lands on the intended beat
- the prose feels human and not scripted
- the pacing is right
- the tone matches the story
- the chapter still fits the current plan and world

Then save the chapter.

## After the chapter

Update summary.md with the chapter outcome and make small graph updates only if they matter later. Do not build a giant log of every event. Keep the graph focused on standing facts and long-term state.

## Keep it lean

Do not turn chapter writing into a pile of review theatre. Good prose, good rhythm, and clear story decisions matter more than process.

- One chapter per session. Respect pacing. Respect the mode.
- Never begin from an unapproved or missing plan.
- Never edit `graph.db` or node markdown by hand. Always use `graph.mjs`.
- **Keep the graph small.** Store only what must still be true many chapters later. Default to
  adding no nodes; most chapters add zero or one. Prefer updating an existing node over adding one,
  and a line in `summary.md` over either. A fact that fits an existing node body or the chronicle
  does not get its own node. Never node-ify one-off actions, travel, scenery, or passing beats.
  Merge duplicates on sight and keep the graph dense in edges, lean in nodes.
- Always update summary.md (chronicle) and the graph (memory diff) after writing.
