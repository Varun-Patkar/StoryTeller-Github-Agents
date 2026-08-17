---
name: story-setup
description: "Set up or replan a story: gather the basics, research the canon or genre, develop the plan with the user, and create the story structure only after approval."
---

# Story setup

Use this when the user wants to start a story, replace an old plan, or extend an existing plan. The goal is to work out the story with the user before any chapter is written.

## Step 1 — Ask for the basics

Ask the user for:

- story type: fanfiction or original
- fandom if relevant
- genre
- tone
- story mode
- pacing
- main characters
- rough premise or hook

If the idea is vague, ask for the central conflict and the emotional core.

## Step 2 — Research if needed

If the story is fanfiction or based on an existing world, do the research needed to keep the world and characters grounded. Do not rely on memory alone.

Focus on:

- main canon facts
- important characters and relationships
- setting details
- anything that affects the story's early chapters

For original fiction, keep the research light and focused on genre expectations.

## Step 3 — Develop the plan together

Planning is iterative. Do not jump from the premise to a finished plan.

1. Restate the user's current idea briefly so they can correct it.
2. Offer a small number of meaningful options for unclear parts of the story.
3. Judge each option impartially. Explain its strengths, weaknesses, likely consequences, and conflicts with canon or earlier decisions.
4. Recommend the option that best serves the user's stated goals. Do not agree automatically, flatter the idea, or hide a real problem.
5. Ask the user to choose, combine, reject, or revise the options.
6. Repeat until the premise, character arcs, major conflicts, tone, ending direction, and early chapter route are settled.

Keep unresolved questions visible. Do not silently decide them for the user.

## Step 4 — Draft and approve the plan

Once the direction is stable, draft plan.md. Show the plan to the user in manageable sections and invite changes. Revise it until the user explicitly approves it.

The first lines of an approved plan must include:

```markdown
# Story Plan: <title>

Status: Approved
```

Before approval, use `Status: Draft`. A draft plan is never permission to write a chapter.

## Step 5 — Build the initial story files

Create the story folder under books/<slug>/ with:

- config.md
- plan.md
- summary.md
- chapters/
- graph/

The story plan should include:

- chapter beats
- character arcs
- key places or factions
- early problems and turning points
- what the story is trying to do emotionally

## Step 6 — Keep the graph useful

The graph is memory, not a chapter log. Store only things that matter long-term:

- characters
- places
- factions
- important items
- relationships
- standing world state

Do not fill it with every small event from the story. Use summary.md for timeline and chapter detail.

## Step 7 — Confirm and hand off

After the plan is ready, give the user a short summary of:

- the story's core premise
- the main cast
- the intended tone
- the route for the first chapter

Ask for explicit approval. Only after the user approves the plan, change its status to `Approved` and hand off to write-chapter. Do not draft prose during planning, even as a sample, unless the user separately asks for one.
