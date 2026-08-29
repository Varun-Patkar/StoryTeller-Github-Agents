# Contributing

## Add a story

1. Create the story under `books/<kebab-case-slug>/` with the vendored `story-init` skill or bundled maintenance CLI.
2. Develop characters, worldbuilding, plot, and chapters with the matching Story Skills workflows.
3. Keep chapter files named `chapters/chapter-NN.md`.
4. Add an optional `cover.jpg`, `cover.jpeg`, `cover.png`, or `cover.webp` to the story root.
5. Run Story Skills validation and build the reader before opening a pull request.

```powershell
node .github/skills/story-maintenance/scripts/story.js validate books/<slug>
node .github/skills/story-maintenance/scripts/story.js links books/<slug>
node .github/skills/story-maintenance/scripts/story.js continuity books/<slug>
cd reader
npm test
npm run build
```

## Update vendored skills

Keep upstream skill directories recognizable. Record the new commit SHA in `THIRD_PARTY_NOTICES.md`, preserve the upstream license, and run the bundled CLI plus Better Writing's upstream validation checks. Put repository-specific behavior in `.github/copilot-instructions.md` or the reader adapter instead of rewriting upstream prompts.

## Code changes

Use Astro and TypeScript conventions already present under `reader/`. Keep story discovery compatible with Story Skills schema v2 and add focused tests for parsing or publication behavior.
