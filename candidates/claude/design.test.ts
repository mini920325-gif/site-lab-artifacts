import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultDesign, designLabels, designOptions, designPresets, designTokens,
  normalizeDesign, paletteTokens, readDesign, saveDesign, type Design, type DesignAxis,
} from './design.ts';
import { siteConfig } from './site-config.ts';

const storageKey = 'artifacts-claude-display-v1';
function browserState(search: string, stored: string | null, run: (state: { values: Map<string, string>; reads: () => number; writes: () => number }) => void) {
  const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();
  if (stored !== null) values.set(storageKey, stored);
  let reads = 0, writes = 0;
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { search } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem(key: string) { reads++; return values.get(key) ?? null; },
    setItem(key: string, value: string) { writes++; values.set(key, value); },
  } });
  try { run({ values, reads: () => reads, writes: () => writes }); }
  finally {
    if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation);
    else Reflect.deleteProperty(globalThis, 'location');
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
}

test('32 starting combinations are distinct, valid and remain independently editable', () => {
  assert.equal(designPresets.length, 32);
  assert.deepEqual(designPresets.slice(0, 3).map(p => p.name), ['A · 에디토리얼', 'B · 커먼스', 'C · 아틀라스']);
  assert.equal(new Set(designPresets.map(p => p.id)).size, 32);
  assert.equal(new Set(designPresets.map(p => JSON.stringify(p.design))).size, 32);
  for (const preset of designPresets) {
    assert.deepEqual(normalizeDesign(preset.design), preset.design, preset.name);
    for (const axis of Object.keys(designOptions) as DesignAxis[]) {
      assert.ok(designLabels[axis]);
      const next = designOptions[axis].find(option => option.id !== preset.design[axis])!;
      const changed = normalizeDesign({ ...preset.design, [axis]: next.id });
      assert.equal(changed[axis], next.id);
      for (const other of Object.keys(designOptions) as DesignAxis[]) {
        if (other !== axis) assert.equal(changed[other], preset.design[other]);
      }
    }
  }
});

test('legacy four-axis saved choices remain selected and acquire new default axes', () => {
  const legacy = { layout: 'forum', spacing: 'compact', type: 'large', color: 'forest' };
  browserState('', JSON.stringify(legacy), state => {
    const actual = readDesign();
    assert.deepEqual(actual, { ...defaultDesign, ...legacy });
    assert.equal(state.writes(), 0);
    assert.equal(state.values.get(storageKey), JSON.stringify(legacy));
  });
});

test('normalization discards injected styles, inherited fields, arrays and accessors', () => {
  const malicious = JSON.parse('{"__proto__":{"polluted":true},"constructor":{},"color":"url(https://example.invalid)","frame":"unknown","layout":"forum","extra":"ignored"}');
  assert.deepEqual(normalizeDesign(malicious), { ...defaultDesign, layout: 'forum' });
  assert.equal(Object.hasOwn(normalizeDesign(malicious), '__proto__'), false);
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
  assert.deepEqual(normalizeDesign(Object.create({ color: 'night' })), defaultDesign);
  assert.deepEqual(normalizeDesign([{ color: 'night' }]), defaultDesign);
  const accessor = Object.defineProperty({}, 'color', { get() { throw Error('must not run'); } });
  assert.deepEqual(normalizeDesign(accessor), defaultDesign);
  const normalized = normalizeDesign(null);
  normalized.color = 'night';
  assert.equal(defaultDesign.color, 'paper');
});

test('URL design previews override storage without reading or writing it', () => {
  const selected = designPresets[2].design;
  const search = '?designPreview=1&design=' + encodeURIComponent(JSON.stringify(selected));
  browserState(search, JSON.stringify(designPresets[0].design), state => {
    assert.deepEqual(readDesign(), selected);
    assert.equal(state.reads(), 0);
    assert.equal(state.writes(), 0);
    assert.equal(state.values.get(storageKey), JSON.stringify(designPresets[0].design));
  });
  browserState('?design=' + encodeURIComponent(JSON.stringify(selected)), JSON.stringify(designPresets[1].design), () => {
    assert.deepEqual(readDesign(), designPresets[1].design);
  });
});

test('invalid and oversized preview JSON falls back safely without touching storage', () => {
  for (const value of ['{broken', ' '.repeat(2049) + '{}', '["night"]']) {
    browserState('?designPreview=1&design=' + encodeURIComponent(value), JSON.stringify(designPresets[2].design), state => {
      assert.deepEqual(readDesign(), defaultDesign);
      assert.equal(state.reads(), 0);
      assert.equal(state.writes(), 0);
    });
  }
});

test('save persists only supported axes and read recovers malformed saved state', () => {
  browserState('', '{broken', state => {
    assert.deepEqual(readDesign(), defaultDesign);
    const input = { ...designPresets[9].design, color: 'expression(alert(1))', secret: 'not a design field' };
    assert.equal(saveDesign(input as unknown as Design), true);
    assert.deepEqual(JSON.parse(state.values.get(storageKey)!), { ...designPresets[9].design, color: defaultDesign.color });
    assert.deepEqual(readDesign(), normalizeDesign(input));
  });
});

function luminance(hex: string): number {
  const values = hex.slice(1).match(/../g)!.map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
}
function contrast(a: string, b: string): number {
  const first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
}

test('all ten palettes have matching theme keys and readable text/button tokens', () => {
  assert.equal(Object.keys(paletteTokens).length, 10);
  assert.deepEqual(Object.keys(siteConfig.themes).sort(), Object.keys(paletteTokens).sort());
  for (const color of Object.keys(paletteTokens) as Design['color'][]) {
    const palette = paletteTokens[color];
    assert.equal(siteConfig.themes[color].color, palette.accent);
    const tokens = designTokens({ ...defaultDesign, color });
    assert.deepEqual(Object.keys(tokens).sort(), ['--page', '--paper', '--ink', '--muted', '--line', '--accent', '--soft', '--on-accent'].sort());
    for (const token of Object.values(tokens)) assert.match(token, /^#[0-9a-f]{6}$/i);
    assert.ok(contrast(palette.ink, palette.paper) >= 4.5, color + ' body text');
    assert.ok(contrast(palette.muted, palette.bg) >= 4.5, color + ' secondary text');
    assert.ok(contrast(palette.onAccent, palette.accent) >= 4.5, color + ' action text');
  }
});
