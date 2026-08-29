# Story workspace

This repository uses the vendored Story Skills workflows for planning, drafting, and continuity, with Better Writing as the prose revision companion. Keep those upstream skill files recognizable and update them from their recorded sources rather than folding local rules into them.

## Story location

- Every story project lives at `books/<kebab-case-slug>/`.
- Initialize through the `story-init` skill. When using the bundled CLI directly, run `node .github/skills/story-maintenance/scripts/story.js init "<title>" --dir books/<kebab-case-slug>` from the repository root.
- Use the upstream schema: `story.md`, registries, worldbuilding, plot, scenes, continuity, glossary, and `chapters/`.
- Draft chapters as `chapters/chapter-NN.md`. The reader publishes the text under `## Chapter Text` and hides frontmatter and outlines.
- An optional `cover.jpg`, `cover.jpeg`, `cover.png`, or `cover.webp` belongs in the story root.
- Optional `author` and `fandom` fields may be added to `story.md` frontmatter for the reader. Core Story Skills fields remain authoritative.

## Workflow

- Use the matching vendored skill under `.github/skills/` for story work.
- Use `better-writing` when revising prose that is generic, formulaic, over-polished, or AI-sounding. Preserve intentional voice and story facts.
- After story changes, run the bundled CLI checks appropriate to the edit: `validate`, `reindex`, `wordcount --write`, `links`, and `continuity`.
- To verify publication, run `npm test` and `npm run build` from `reader/`.
