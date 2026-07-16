---
name: humanize-prose
description: "The de-perfect / humanization pass. Use to strip AI tells out of story prose and make it read like a human wrote it. USE FOR: 'make this less AI', 'this sounds like an LLM', 'de-slop this chapter', 'more human', 'fix the writing tics', or as the mandatory final step of write-chapter. Targets the 'X, not Y' antithesis tic, em dashes, uniform rhythm, over-explained fights, risk-setting, micro-analysis, purple prose, and stock phrases. Keywords: humanize, de-slop, AI tics, less perfect, natural prose, rewrite pass."
---

# Humanize Prose (the de-perfect pass)

Good human writing is a little uneven. LLM writing is smooth, balanced, and over-explained, and
that smoothness is exactly what makes it obvious and tiring to read. This pass takes a finished
draft and **makes it less perfect on purpose** so it reads like a person wrote it.

Run this as the final stage of `write-chapter`, or standalone on any prose the user hands you.

## Procedure

1. Read the full anti-slop bible: [anti-slop.md](./references/anti-slop.md). It is the
   authoritative list of what to remove and why.
2. Read the draft once, top to bottom, as a reader — not as an editor. Note where you get bored,
   where you skim, where a sentence sounds "written."
3. Do a targeted pass for each **Tier-1 tell** below. These are the dead giveaways; zero tolerance.
4. Do a rhythm-and-texture pass (Tier 2) to add human unevenness.
5. Re-read. If a paragraph could be cut with no loss, cut it. Repeat until a clean read produces
   no Tier-1 hits.

## Tier 1 — dead giveaways (must be ZERO)

1. **The "X, not Y" antithesis tic.** This is the single worst tell. Any sentence built on
   contrast-for-emphasis: "It was a warning, not a threat." / "She didn't walk, she prowled." /
   "not just tired but hollow." / "This wasn't courage. It was something colder." Readers can
   brush past an em dash; they cannot brush past this because they have to parse the negation to
   understand the sentence. **Rewrite every one as a plain positive statement.** Say what the
   thing *is* and stop. Delete the "not…" clause entirely.
   - Allowed: at most one deliberate not/but beat in a whole chapter, only for a real emotional
     turn, and never inside a single sentence as description. When in doubt, cut it.
2. **Em dashes (—).** Zero. Use a comma, a period, an ellipsis (`...`), or a new sentence.
3. **Uniform paragraph rhythm.** If every paragraph is 3-4 lines of similar length, break it up.
   Real prose varies. But do not overcorrect into a stack of isolated one-line paragraphs: the
   writing samples almost never leave a single short sentence alone as its own paragraph. Get your
   rhythm mostly from *variation inside* paragraphs (short sentence, short sentence, then a longer
   one that wanders). Reserve a standalone one-line beat for a genuine gut-punch, and use it rarely.
   Look at the writing samples for the target texture.
4. **Over-explained fights and risk-setting.** See "Combat & competence" below.
5. **Micro-analysis / over-explanation.** The narrator explaining a feeling three ways, or
   walking through a character's risk calculus step by step. State it once, trust the reader, move.

## Tier 2 — human texture (add these back)

- **Vary sentence length hard.** Short. Short. Then a longer one that wanders a little and adds a
  detail nobody asked for. Then short again.
- **Throwaway lines.** A character notices something irrelevant. The bread is stale. A dog barks
  somewhere. These do nothing for the plot and that is the point — LLMs never add them, humans
  always do.
- **Imperfect information.** Let the POV character misread a situation, focus on the wrong thing,
  forget something they should know, or be wrong. Perfect protagonists read fake.
- **Let scenes end unresolved.** A conversation trails off. A question goes unanswered. Not every
  beat wraps up in the scene it started in.
- **Chill moments.** After anything heavy, decompress: someone eats, stares at nothing, has a
  pointless exchange. Not every moment is loaded. Most moments are just moments.
- **Keep behavior credible.** Human texture comes from cadence, attention, imperfect recall, and
  unfinished phrasing. Do not manufacture it by making characters talk to animals, perform random
  quirks, ignore obvious priorities, or commit deliberate grammar and spelling mistakes.

## Combat & competence (fixes the over-detailed-fight problem)

- **Fights are brief.** A skilled character against ordinary opponents is a paragraph, sometimes a
  sentence. Do not choreograph blocking blow by blow; the reader loses the thread and stops caring.
- **Competence is quiet.** A veteran (or a demigod-tier protagonist) does not deliver an internal
  risk assessment before fighting minor enemies. They just handle it, maybe with a bored or dry
  aside. Reserve hesitation and fear for threats that genuinely outclass them.
- **The story is about emotion,** not the fight. If a scene's real weight is a relationship or a
  choice, do not let the action swallow it. Cut choreography to make room for the feeling.

## What you may NOT change

- Plot, outcomes, characterization, canon facts, or a character's established voice. This pass
  changes *how it reads*, never *what happens*. If removing a tell would change meaning, rephrase
  instead of cutting.
- In **Companion Writer** mode, never alter the human's words beyond grammar, rhythm, em-dash
  removal, and the "X, not Y" fix — and only where it does not change their meaning.
