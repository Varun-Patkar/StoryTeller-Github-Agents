# Anti-Slop Bible

The authoritative list of AI tells to remove from story prose, and the human textures to keep.
`humanize-prose` and `write-chapter` both use this. The `writing-style` instruction file is a
condensed always-on echo of it.

Study the gold-standard human samples in
[write-chapter/references/samples](../../write-chapter/references/samples/) for what the target
actually reads like: ultra-short paragraphs, single-line beats, dry tired internal voice, casual
profanity where it fits the character, canon woven in quietly, emotion carried by small concrete
moments, almost no fight choreography.

## The one rule above all: kill the antithesis tic

Ban every "define-by-contrast" construction. These are the number-one giveaway of LLM prose
because the reader must parse a negation to understand the sentence, so the eye cannot skim past
it the way it skims past an em dash.

Banned shapes (non-exhaustive):
- "X, not Y." — "It was a warning, not a threat."
- "not X but Y" / "not just X but Y" — "not fear but something close to it."
- "This wasn't X. It was Y." (as its own two-sentence beat)
- "less X than Y" — "less a plan than a hope."
- "X. Or maybe Y." used to hedge every observation.
- Negation-stacking: "He didn't feel fear. Not anger. Not sadness." (also a negative-list, see below)

Fix: state what the thing **is**, in the positive, and stop. Delete the contrast clause. If you
genuinely need one not/but beat for a real emotional pivot, you may keep a single one per chapter,
never inside a descriptive sentence.

## Hard bans (prose)

- **NO em dashes (—)** anywhere in final prose. Comma, period, ellipsis (`...`), or new sentence.
- **NO purple prose.** No words you wouldn't say out loud: "incandescent", "antithetical",
  "volcanic", "primal", "visceral", "ineffable", "gossamer".
- **NO abstract-sensation verbs:** "thrummed", "pulsed", "cascaded", "reverberated", "permeated",
  "coiled", "unfurled". Use concrete physical description.
- **NO AI transformation clichés:** "crystallized", "coalesced", "manifested", "materialized",
  "settled over him", "washed over". Just say what happened.
- **NO cliché gesture-as-emotion shorthand:** "clenched his fists", "squared his shoulders",
  "narrowed his eyes", "jaw tightened", "steeled himself", "let out a breath he didn't know he
  was holding". Show emotion through action, dialogue, or a concrete thought.
- **NO stock atmospheric phrases:** "the air crackled", "time seemed to slow", "something
  shifted", "eyes that held", "the weight of", "a sense of", "couldn't help but", "found
  himself", "a chill ran down".
- **NO dramatic standalone one-liners** as their own paragraph: "Silence." "Darkness." "And then
  everything changed." "Everything." Deploy fragments for rhythm, not for cheap portent.
- **NO flowery metaphors or similes.** Keep images grounded and literal.
- **NO fancy dialogue tags:** no "exclaimed", "declared", "retorted", "growled", "breathed",
  "murmured", "hissed". Use "said", "asked", "replied", "added", or no tag when it's clear.
- **NO negative-list descriptions.** Never define something by what it is not. Say what it is.
- **NO mystical/portentous filler.** Every sentence earns its place with plot, character,
  information, or a real concrete image. If it does none, cut it.

## Hard bans (structure & pacing)

- **NO uniform emotional intensity.** Not every glance is loaded, not every silence is heavy.
  Most moments are ordinary. Write them ordinary.
- **NO uniform paragraph length.** Break up any run of same-size paragraphs. Use one-line beats.
- **NO recycled scene structure across chapters.** If the last chapter opened with waking up,
  don't. If it ended on a cliffhanger question, end this one differently.
- **NO repetition of information.** Say a fact, feeling, or image once. Trust the reader's memory.
- **NO scenic padding / audio landscape.** No inventories of rooms the POV just passes through,
  no distant sirens/horns/crowds unless the character acts on them. Transitional space = one
  sentence max ("He cut through the back lot.").
- **NO suspense-by-overexplanation.** If a thing happens, say it happened. Don't stretch a moment
  across extra paragraphs to inflate it. Quick and sharp beats slow and bloated.
- **NO over-detailed combat.** No blow-by-blow choreography, no slow-motion. See Combat below.
- **NO risk-setting monologues** before routine fights (see Combat below).
- **NO repeated signature lines / motifs** turned into a per-chapter refrain. Say an idea once.
- **NO unintended romantic/sexual subtext** with any non-designated-love-interest, and NEVER with
  children. Keep those bonds plainly platonic or protective; no possessive/ownership framing.

## Combat & competence

- Brief. A capable character vs ordinary foes is one paragraph, often one sentence. The reader
  should never have to reconstruct fight blocking in their head.
- Competence is quiet and sometimes bored. A veteran or superhuman protagonist does not run a
  risk assessment before minor threats. Save hesitation, fear, and detailed tactics for enemies
  who genuinely outclass them.
- The emotional stakes of the scene outrank the physical ones. Cut choreography to protect the
  feeling.

## Keep these (human texture)

- Contractions in narration ("he'd", "couldn't", "wasn't"). Formal narration reads stiff.
- Short, mobile-friendly paragraphs; 1-3 sentences; frequent single-line beats.
- Wildly varied sentence length, on purpose.
- Throwaway observations that don't advance the plot (stale bread, a barking dog, bad tea).
- Imperfect information: the POV misreads, forgets, fixates on the wrong thing, is sometimes wrong.
- Chill/decompress beats after heavy scenes; scenes that end unresolved.
- Concrete specifics pulled from research: real place names, foods, objects, terms.
- Dry, situational humor under pressure; deadpan reactions. Don't force jokes.

## System / LitRPG formatting (only if the story uses it)

Render systems with concrete numbers, each line on its own line, in bold, exactly like the
samples. Never a vague "glowing pane of light". Backtick system lines need a blank line between
each or Markdown collapses them into one inline-code blob. Follow the story's own system spec
(plan / relevant graph node) for canonical figures.
