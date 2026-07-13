---
description: "Write chapter N of New Game Plus: The Eagle Bearer. Pass the chapter number as the argument."
name: "Write AC Eagle Bearer Chapter"
argument-hint: "Chapter number (e.g. 2)"
---

Write **chapter $input** of the story *New Game Plus: The Eagle Bearer* using the `write-chapter`
skill. Do everything yourself in this conversation (the skills are inline; there is no delegation).

## Order of operations

1. **Re-anchor on the target voice.** Read both gold-standard samples in full first:
   - [sample-01-eagle-of-alamut.md](../../.github/skills/write-chapter/references/samples/sample-01-eagle-of-alamut.md)
   - [sample-02-eagle-of-alamut.md](../../.github/skills/write-chapter/references/samples/sample-02-eagle-of-alamut.md)
2. Ground yourself in the story files:
   - [config.md](../../books/new-game-plus-the-eagle-bearer/config.md)
   - [plan.md](../../books/new-game-plus-the-eagle-bearer/plan.md)
   - [summary.md](../../books/new-game-plus-the-eagle-bearer/summary.md) and the most recent 1-2 chapter files for immediate continuity.
3. Load memory from the graph:
   ```
   node .github/scripts/graph.mjs recap --story new-game-plus-the-eagle-bearer --query "chapter $input events characters"
   ```
4. Run the full `write-chapter` pipeline: canon lock, voice prep, scene blueprint (output it),
   draft, then the three review passes (critic, humanize, final read) before saving.

## Chapter requirements

- **Output file**: `books/new-game-plus-the-eagle-bearer/chapters/chapter-$input.md` (zero-padded, e.g. `chapter-02.md`).
- **Length**: follow the story's configured pacing.
- **POV**: Third Person Limited (Theron's perspective unless the plan dictates otherwise).
- **Prose**: obey the `writing-style` rules. No em dashes. No "X, not Y" antithesis tic. Brief
  combat, emotion first, real character voices grounded in the graph.
- **LitRPG/System elements** (if used): concrete numbers, itemized prices, visible balances, short
  pings, exactly as in the samples. Never a vague "glowing pane of light".

## After writing

Update `summary.md` (the chronicle) and emit the graph **memory diff** (only permanent changes;
follow the Graph Worthiness Test), then `consolidate` + `validate`.
