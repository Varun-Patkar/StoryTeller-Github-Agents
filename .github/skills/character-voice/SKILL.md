---
name: character-voice
description: "Build, ground, refresh, and gate character voice so dialogue sounds like the real character, not a generic Ivy-League narrator. USE FOR: 'does X sound like themselves', 'the dialogue is off', 'ground the voice', 'fix character voice', 'voice check', or as the mandatory voice gate inside write-chapter. Pulls ACTUAL dialogue/quotes from the source material online, stores a grounded Voice Profile in the character's graph node, and tracks how a voice legitimately changes over time. Keywords: character voice, dialogue, sounds like, in-character, out of character, voice profile, mannerisms, speech pattern."
---

# Character Voice

The most common failure of AI fanfiction: every character talks like the same over-articulate
narrator. Markos should sound like a happy-go-lucky merchant working an angle. Phoibe should
sound like a street kid forced to grow up too fast. This skill makes each voice specific and
keeps it that way.

## Core ideas

1. **Ground the baseline in real source dialogue.** A voice profile built from memory drifts
   toward generic. Pull the character's *actual lines* from the source and derive the voice from
   them.
2. **A voice is a moving target.** Characters change with what happens to them. Track the baseline
   AND the current state so growth reads as growth, not as a continuity error.
3. **Gate every chapter.** Before a chapter is saved, each speaking character's lines are checked
   against their profile. Off-voice lines are rewritten.

## Where the voice lives

In the character's graph node body (`books/<slug>/graph/nodes/character-*.md`), edited only via
`.github/scripts/graph.mjs`. Every character node has a **Voice & Mannerisms** section with this
structure:

```markdown
## Voice & Mannerisms

### Baseline (source-grounded)
- Register / vocabulary: <plain? formal? slangy? profane? terse?>
- Speech patterns / tics: <verbal habits, sentence shapes, what they never say>
- Attitude in dialogue: <warm? guarded? sarcastic? deferential?>

### Source Quotes (real lines)
- "<verbatim line from the source>" — <where it's from, what it shows>
- (5-10 of these for a lead; 2-3 for a minor character. These are the anchor.)

### Voice Evolution (tracked)
- Ch <n> baseline: <how they sound at the start of the story>
- Ch <n>: <what shifted and why — a loss, a betrayal, growing up, hardening>
```

`canon`/`au`/`original` still applies: a canon character's baseline must match the source; an
AU or original character gets a baseline you define, but even original characters set in a source
world should match that world's register and speech norms.

## Procedure — build or refresh a profile

1. **Find real lines.** Research the character online (webiq first: `mcp_web_iq_mcp_se_web` →
   `mcp_web_iq_mcp_se_browse`; then SearXNG/Playwright). Best sources: the fandom wiki's "Quotes"
   section, transcript/script sites, subtitle dumps, "notable quotes", let's-play transcripts for
   game characters. Collect verbatim lines. Prefer lines that show attitude, not plot.
2. **Derive the baseline** from those lines: register, vocabulary ceiling and floor, sentence
   length, tics, what they would never say. Write it into the node's Voice & Mannerisms → Baseline.
3. **Store the quotes** verbatim under Source Quotes. These are the ground truth the gate checks
   against.
4. **Seed Voice Evolution** with the Ch-N baseline line.
5. Save via `graph.mjs update-node --story <slug> --id character-<slug> --body-file <temp.md>`.

## Procedure — the voice gate (inside write-chapter)

For each character with dialogue in the drafted chapter:

1. Pull their node (`get-node`) and read Voice & Mannerisms (Baseline + Source Quotes + current
   Voice Evolution state).
2. Read their lines in the draft. For each, ask: would the person who said the Source Quotes say
   this, at this point in the story? Watch for: everyone sounding equally eloquent; a plain-spoken
   character using literary vocabulary; a child sounding like an adult; jokes in a humorless
   character's mouth.
3. Rewrite off-voice lines to match the profile. Keep the meaning; change the wording, rhythm,
   and register.
4. If the character has legitimately changed (trauma, time, growth), don't force the old voice.
   Update Voice Evolution with the shift and write them at their new state consistently.

## When voice drifts on purpose

Record every deliberate voice change in Voice Evolution with the chapter and the cause. That log
is what lets later chapters keep the *new* voice consistent instead of snapping back to baseline.
