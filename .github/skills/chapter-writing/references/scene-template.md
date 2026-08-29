# Scene Template

Use this template when creating a machine-readable scene file at `scenes/chapter-{NN}-scene-{NN}.md`.

```yaml
---
title: "{Scene Title}"
chapter: chapter-{NN}
scene: {N}
pov: {character-kebab}
location: {location-kebab}
characters:
  - {character-kebab}
arcs-advanced:
  - {arc-kebab}
status: {outline|draft|revised|final|complete}
state-changes:
  - target: {character-or-artifact-kebab}
    change: "{What changed and must carry forward}"
---
```

## Purpose

What this scene changes for plot, character, theme, or reader knowledge.

## Continuity Notes

Track character state, object state, knowledge, timing, and location facts that later chapters must preserve.
