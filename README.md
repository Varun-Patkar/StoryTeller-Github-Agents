# StoryTeller

StoryTeller combines two open agent-skill projects with a static Astro reader:

- [Story Skills](https://github.com/danjdewhurst/story-skills) handles story setup, characters, worldbuilding, plot, chapter drafting, revision, and deterministic continuity checks.
- [Better Writing](https://github.com/forjd/better-writing) revises prose without flattening intentional voice or inventing detail.
- The Astro app discovers finished stories under `books/` and publishes their chapters automatically.

The upstream revisions used by this branch are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Start a story

Open the repository in VS Code with GitHub Copilot and ask to start a new story. The `story-init` skill gathers the brief and creates the upstream project structure under `books/<story-slug>/`.

The bundled maintenance CLI can also initialize the structure directly:

```powershell
node .github/skills/story-maintenance/scripts/story.js init "Story Title" --dir books/story-title
```

Story Skills stores planning and continuity material in plain Markdown with YAML frontmatter:

```text
books/story-title/
├── story.md
├── characters/
├── worldbuilding/
├── plot/
├── scenes/
├── continuity/
├── glossary/
└── chapters/
    ├── _index.md
    └── chapter-01.md
```

Use the matching skill for character, world, plot, chapter, and revision work. Run Better Writing on prose that reads generic or formulaic. The chapter-writing workflow recognizes it as a companion skill.

## Reader contract

The reader discovers any `books/<slug>/story.md` that follows Story Skills schema v2. It reads:

- `title`, `genre`, `themes`, `pov`, and `status` from YAML frontmatter
- `author` and `fandom` when supplied as optional reader metadata
- the `Synopsis` section from `story.md`
- `cover.jpg`, `cover.jpeg`, `cover.png`, or `cover.webp` from the story root
- numbered chapters from `chapters/chapter-NN.md`

Upstream chapter files may contain frontmatter, an outline, and a `## Chapter Text` section. The web reader publishes only the chapter text. A plain Markdown chapter with an H1 and prose also works.

## Validate a story

Run the maintenance commands from the story directory, or pass its path:

```powershell
node .github/skills/story-maintenance/scripts/story.js validate books/story-title
node .github/skills/story-maintenance/scripts/story.js reindex books/story-title
node .github/skills/story-maintenance/scripts/story.js wordcount books/story-title --write
node .github/skills/story-maintenance/scripts/story.js links books/story-title
node .github/skills/story-maintenance/scripts/story.js continuity books/story-title
```

## Run the reader

```powershell
cd reader
npm install
npm test
npm run dev
```

The GitHub Pages workflow rebuilds on changes under `books/` or `reader/` after they reach `main`.

## License

Repository code is available under [LICENSE](LICENSE). Vendored skill licenses and pinned source revisions are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
