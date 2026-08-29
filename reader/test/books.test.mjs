import test from 'node:test';
import assert from 'node:assert/strict';

const books = await import('../src/lib/books.ts');

test('parses upstream story metadata and synopsis', () => {
  assert.equal(typeof books.parseStoryMarkdown, 'function');

  const story = books.parseStoryMarkdown(`---
title: The Last Ember
schema-version: 2
genre: fantasy
themes:
  - redemption
  - memory
pov: third-person-limited
status: drafting
author: A. Writer
fandom: Original
---
# The Last Ember

## Synopsis

Sera returns to a city that has forgotten her.

## Tone & Style

Restrained and intimate.
`);

  assert.deepEqual(story, {
    title: 'The Last Ember',
    author: 'A. Writer',
    synopsis: 'Sera returns to a city that has forgotten her.',
    fandom: 'Original',
    genre: ['fantasy'],
    themes: ['redemption', 'memory'],
    pov: 'third-person-limited',
    status: 'drafting',
  });
});

test('extracts upstream chapter prose without publishing planning notes', () => {
  assert.equal(typeof books.parseChapterMarkdown, 'function');

  const upstream = books.parseChapterMarkdown(`---
title: The Ember Wakes
number: 1
status: draft
---
# Chapter 1: The Ember Wakes

## Outline

1. Sera returns home.

---

## Chapter Text

Sera crossed the empty square.
`);

  assert.equal(upstream.title, 'The Ember Wakes');
  assert.equal(upstream.prose, 'Sera crossed the empty square.');

  const handwritten = books.parseChapterMarkdown(`# Chapter 2: Rain

Rain fell through the broken roof.
`);

  assert.equal(handwritten.title, 'Rain');
  assert.equal(handwritten.prose, 'Rain fell through the broken roof.');
});