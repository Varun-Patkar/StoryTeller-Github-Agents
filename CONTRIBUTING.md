# Contributing to StoryTeller

Thanks for your interest in contributing! This project is open source under the MIT license and welcomes contributions of all kinds — stories, code, and improvements.

## Adding Your Own Stories

The easiest way to contribute is by writing and submitting your own stories.

### Option 1: Use the GitHub Copilot Skills (Recommended)

1. **Fork** this repository and clone it locally.
2. Open the project in **VS Code** with [GitHub Copilot](https://github.com/features/copilot) enabled.
3. Say **"new story"** in Copilot Chat — the `story-setup` skill will walk you through setup:
   - Pick a genre, fandom, tone, and pacing.
   - It researches the fandom and builds a detailed story plan.
4. Say **"next chapter"** to write chapters one at a time (the `write-chapter` skill).
5. When you're happy with your story, open a **Pull Request** to merge it into the main repo.

### Option 2: Preview in the Reader

1. Fork and clone the repo.
2. Build the static reader site:
   ```bash
   cd reader
   npm install
   npm run dev
   ```
3. Open the local dev URL to browse your stories.
4. Commit your changes and open a PR.

### Option 3: Write Manually

1. Fork and clone the repo.
2. Create a new folder under `books/` with your story slug (lowercase, kebab-case):
   ```
   books/my-awesome-story/
   ├── config.md
   ├── plan.md
   ├── summary.md
   └── chapters/
       ├── chapter-01.md
       └── ...
   ```
3. Use an existing story as a template for the `config.md` format (markdown table with Setting/Value columns).
4. Write your chapters as markdown files with `# Chapter N: Title` as the first line.
5. Optionally add a `cover.png` (or `.jpg`/`.webp`) for the book cover.
6. Open a PR.

## Story File Format

Each story lives in `books/<slug>/` with this structure:

| File | Purpose |
|------|---------|
| `config.md` | Story settings as a markdown table (title, author, genre, synopsis, etc.) |
| `plan.md` | Arc-by-arc chapter outline |
| `summary.md` | Running chapter summaries (updated after each chapter) |
| `chapters/chapter-01.md` | Chapter files, numbered sequentially |
| `cover.png` | Optional cover image |
| `research/` | Optional fandom research files |

### config.md Format

```markdown
# Story Configuration

| Setting | Value |
| ------- | ----- |
| Type    | Original / Fanfiction |
| Fandom  | N/A / The Last of Us / etc. |
| Genre   | Action, Adventure |
| Themes  | Your themes here |
| Title   | Your Story Title |
| Author  | Your Name |
| Synopsis | A brief description of your story. |
| Status  | In Progress / Complete |
| Total Chapters | 50 |
```

## Code Contributions

If you want to improve the reader, the graph scripts, or the skills:

1. Fork and clone the repo.
2. Create a feature branch: `git checkout -b feature/my-improvement`
3. Make your changes.
4. Test locally:
   - **Reader**: `cd reader && npm install && npm run dev`
   - **Graph scripts**: `cd .github/scripts && npm install` then `node graph.mjs schema`
5. Open a PR describing what you changed and why.

## Guidelines

- **Stories**: Any genre, any fandom, any length. Keep content appropriate (no explicit/NSFW).
- **Code**: Follow the existing conventions. Astro/TypeScript for the reader, Node ESM for the graph scripts.
- **Commits**: Use clear, descriptive commit messages.
- **PRs**: One story or one feature per PR. Include a brief description.

## Questions?

Open an issue if you have questions or need help getting started.
