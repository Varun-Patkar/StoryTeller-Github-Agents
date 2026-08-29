import test from 'node:test';
import assert from 'node:assert/strict';
import { getBranchTargets } from '../src/lib/branches.ts';

test('maps the two published branches to stable library roots', () => {
  assert.deepEqual(getBranchTargets('/StoryTeller-Github-Agents/'), [
    { name: 'main', href: '/StoryTeller-Github-Agents/' },
    {
      name: 'evaluation/story-skills',
      href: '/StoryTeller-Github-Agents/branches/evaluation-story-skills/',
    },
  ]);
});

test('normalizes local and nested base paths', () => {
  assert.equal(getBranchTargets('')[0].href, '/');
  assert.equal(getBranchTargets('/')[0].href, '/');
  assert.equal(getBranchTargets('/repository')[0].href, '/repository/');
  assert.equal(getBranchTargets('/owner/repository/')[0].href, '/owner/repository/');
});