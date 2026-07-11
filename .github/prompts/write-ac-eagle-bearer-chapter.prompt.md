---
description: "Write chapter N of New Game Plus: The Eagle Bearer. Pass the chapter number as the argument."
name: "Write AC Eagle Bearer Chapter"
argument-hint: "Chapter number (e.g. 2)"
agent: storyteller
---

Write **chapter $input** of the story *New Game Plus: The Eagle Bearer*.

## Hard Rules — Follow in This Exact Order
0. Don't delegate. do it yourself. Also feel free to use the graph to understand what is to be written in thorough before writing.

1. **READ THE WRITING SAMPLES IN FULL BEFORE WRITING A SINGLE WORD.**
   Read both files completely:
   - [chapter-01-new-game.md](../../.github/agents/writing-samples/chapter-01-new-game.md)
   - [chapter-02-gearing-up.md](../../.github/agents/writing-samples/chapter-02-gearing-up.md)
   Do not skip or skim. This is mandatory — not optional.

2. Read the story files to ground yourself:
   - [config.md](../../books/new-game-plus-the-eagle-bearer/config.md)
   - [plan.md](../../books/new-game-plus-the-eagle-bearer/plan.md)

3. Run the graph recap to pull in relevant nodes and open threads:
   ```
   node .github/scripts/graph.mjs recap --story new-game-plus-the-eagle-bearer --query "chapter $input events characters"
   ```
   Also read [summary.md](../../books/new-game-plus-the-eagle-bearer/summary.md) for the running story-so-far narrative, and the most recent 1–2 chapter files for immediate continuity.

4. Only after completing steps 1–3, draft and write the chapter.

## Chapter Requirements

- **Length**: 3,000–5,000 words. Do not go below 3,000 under any circumstances.
- **Output file**: `books/new-game-plus-the-eagle-bearer/chapters/chapter-$input.md` (zero-padded to two digits, e.g. `chapter-02.md`).
- **POV**: Third Person Limited (Theron's perspective unless the plan dictates otherwise for this chapter).
- **No em dashes** in prose. Use commas, periods, ellipses (...), or sentence breaks instead.
- **LitRPG/System elements**: Render with concrete numbers, itemized prices, visible balances, short pings — exactly as in the writing samples. Never vague "glowing pane of light."
- Match the rhythm, paragraph length, dialogue cadence, and tone of the writing samples.

## After Writing

- Append a concise chapter summary to [summary.md](../../books/new-game-plus-the-eagle-bearer/summary.md).
- Update any relevant graph nodes via `node .github/scripts/graph.mjs` for new characters, events, or state changes introduced in this chapter.
