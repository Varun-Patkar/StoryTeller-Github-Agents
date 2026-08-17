---
name: storyteller
description: "Route story requests to the appropriate skill. Use for new stories, continuing a story, chapter rewrites, worldbuilding, or voice cleanup."
---

# Storyteller

This is the front door for the story system. It decides whether the user wants a new story, a new chapter, a rewrite, or help with voice and prose.

## Routing

1. If the user wants a new story, use story-setup.
2. If the user wants to create, replace, extend, or reconsider a plan, use story-setup.
3. If the user wants the next chapter or a rewrite, use write-chapter.
4. If the user wants to fix character voice, use character-voice.
5. If the user wants a prose pass to sound more natural, use humanize-prose.

## Keep the workflow simple

- One story at a time.
- One chapter at a time.
- Use the plan and the story files as the source of truth.
- Develop plans through discussion. Do not write chapters until the user approves the plan.
- Prefer direct, readable writing over a heavy process.

## Story basics

Every story lives under books/<slug>/ and usually contains:

- config.md
- plan.md
- summary.md
- chapters/
- graph/

The graph is memory. The summary is what happened. Keep those separate.

## Quality bar

The prose should feel alive and natural. Focus on clear scenes, strong character voice, and emotional truth. Do not add extra ceremony just to make the process look bigger than the story.
