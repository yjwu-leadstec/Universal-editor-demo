import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const base = '../blocks/product-feature-picture-group/product-feature-picture-group';
const [css, js, modelRaw] = await Promise.all([
  readFile(new URL(`${base}.css`, import.meta.url), 'utf8'),
  readFile(new URL(`${base}.js`, import.meta.url), 'utf8'),
  readFile(new URL(`${base.replace(/\/product-feature-picture-group$/, '/_product-feature-picture-group')}.json`, import.meta.url), 'utf8'),
]);
const model = JSON.parse(modelRaw);

test('decorate reuses the shared product-block helpers and stays UE-editable', () => {
  // shared helpers, not a bespoke implementation
  assert.match(js, /from '\.\.\/\.\.\/scripts\/product-block-utils\.js'/);
  assert.match(js, /initProductBlock\(block\)/);
  assert.match(js, /createSectionHeader\(block\)/);
  // grouped + flat card collection
  assert.match(js, /modelItems\(block, 'product-feature-picture-group-group'\)/);
  assert.match(js, /modelItems\(group, 'product-feature-picture-group-card'\)/);
  assert.match(js, /modelItems\(block, 'product-feature-picture-group-card'\)/);
  // placeholder tile label per design
  assert.match(js, /createMedia\(item, \{ fallbackLabel: '图片' \}\)/);
  // instrumentation must survive replaceChildren so the Author canvas stays editable
  assert.match(js, /addBlockAnchor\(block, block, shell\)[\s\S]*block\.replaceChildren\(shell\)/);
  assert.match(js, /moveItemInstrumentation\(item, card\)/);
  assert.match(js, /instrumentProp\(/);
  // this block has no per-card CTA link
  assert.doesNotMatch(js, /createProductLink/);
});

test('cards are image-fill tiles with overlaid copy (design: radius 10, 22/16px)', () => {
  assert.match(css, /\.product-feature-picture-group-list\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.product-feature-picture-group-card\s*\{[^}]*border-radius:\s*10px/);
  assert.match(css, /\.product-feature-picture-group-card \.product-media\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0/);
  assert.match(css, /\.product-feature-picture-group-copy\s*\{[\s\S]*position:\s*absolute[\s\S]*color:\s*#fff/);
  assert.match(css, /\.product-feature-picture-group-copy h3\s*\{[\s\S]*font-size:\s*22px/);
  assert.match(css, /\.product-feature-picture-group-description\s*\{[\s\S]*font-size:\s*16px/);
});

test('placeholder tile overrides the shared grey to the L6 grey (light #b6b6b6 / dark #5d5d5d)', () => {
  assert.match(css, /is-media-fallback::before[\s\S]*background:\s*#b6b6b6;[\s\S]*font-size:\s*70px/);
  assert.match(css, /\.product-feature-picture-group\.dark[\s\S]*is-media-fallback::before[\s\S]*background:\s*#5d5d5d/);
});

test('mobile collapses to a horizontal snap gallery', () => {
  assert.match(css, /@media \(width <= 719px\)[\s\S]*\.product-feature-picture-group-list\s*\{[\s\S]*grid-auto-flow:\s*column[\s\S]*scroll-snap-type:\s*x mandatory/);
});

test('UE model exposes background variants and drops the link fields', () => {
  const ids = model.models.map((m) => m.id);
  assert.deepEqual(ids, [
    'product-feature-picture-group',
    'product-feature-picture-group-group',
    'product-feature-picture-group-card',
  ]);
  const block = model.models.find((m) => m.id === 'product-feature-picture-group');
  const classes = block.fields.find((f) => f.name === 'classes');
  const bgValues = classes.options[0].children.map((c) => c.value);
  assert.deepEqual(bgValues, ['light', 'dark', 'gray']); // white / black / gray backgrounds
  const card = model.models.find((m) => m.id === 'product-feature-picture-group-card');
  const cardFields = card.fields.map((f) => f.name);
  assert.deepEqual(cardFields, ['image', 'imageAlt', 'mobileImage', 'mobileImageAlt', 'title', 'description']);
  assert.ok(!cardFields.includes('link'), 'card must not expose a link field');
  // nested container filters: block -> [group, card], group -> [card]
  assert.deepEqual(
    model.filters.find((f) => f.id === 'product-feature-picture-group').components,
    ['product-feature-picture-group-group', 'product-feature-picture-group-card'],
  );
  assert.deepEqual(
    model.filters.find((f) => f.id === 'product-feature-picture-group-group').components,
    ['product-feature-picture-group-card'],
  );
});
