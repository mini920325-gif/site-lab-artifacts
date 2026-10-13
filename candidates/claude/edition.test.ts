import test from 'node:test';
import assert from 'node:assert/strict';
import { editions, editionForPath, editionStorageKey, editionPreviewURL } from './edition.ts';
import { ipFeatures } from './ip-content.ts';
import { defaultDesign } from './design.ts';
import { emptyReview, exportReview, parseReview } from './review.ts';

test('edition one preserves its URL, defaults and storage; two IP directions have separate namespaces', () => {
  assert.equal(editions[0].path, '/site-lab-artifacts/candidates/claude/');
  assert.deepEqual(editions[0].design, defaultDesign);
  assert.equal(editionStorageKey('review', 'claude'), 'artifacts-claude-review-v1');
  assert.equal(editionStorageKey('display', 'claude'), 'artifacts-claude-display-v1');
  assert.equal(new Set(editions.flatMap(edition => [editionStorageKey('review', edition.id), editionStorageKey('display', edition.id)])).size, 6);
  for (const edition of editions) {
    assert.equal(editionForPath(edition.path).id, edition.id);
    const preview = new URL(editionPreviewURL(edition), 'https://example.test');
    assert.equal(preview.pathname, edition.path); assert.equal(preview.searchParams.get('designPreview'), '1');
    assert.deepEqual(JSON.parse(preview.searchParams.get('design')!), edition.design);
  }
  assert.equal(editionForPath('/site-lab-artifacts/candidates/ip-2-unknown/').id, 'claude');
});
test('editorial examples have stable identifiers, are clearly synthetic and contain no invented member metrics', () => {
  assert.equal(ipFeatures.length, 3); assert.equal(new Set(ipFeatures.map(feature => feature.id)).size, 3);
  for (const feature of ipFeatures) { assert.ok(feature.title && feature.summary); assert.ok(feature.body.startsWith('편집 콘텐츠 예시')); assert.ok(feature.body.length > 200); }
});
test('JSON retains its edition and an import into a different concept explains the correct destination', () => {
  const data = exportReview(emptyReview(defaultDesign)); assert.equal(data.source.candidate, 'claude'); assert.equal(data.source.edition, 1);
  assert.deepEqual(parseReview(JSON.stringify(data)).design, defaultDesign);
  assert.throws(() => parseReview(JSON.stringify({ ...data, source: { ...data.source, candidate: 'ip-2' } })), /2안/);
});
