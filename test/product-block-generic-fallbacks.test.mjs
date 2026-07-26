import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [
  colorSwitcher,
  fullScreenIntro,
  productHero,
  productStickyNav,
] = await Promise.all([
  readFile(new URL('../blocks/color-switcher/color-switcher.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-product-full-screen-intro/lixiang-product-full-screen-intro.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/product-hero/product-hero.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/product-sticky-nav/product-sticky-nav.js', import.meta.url), 'utf8'),
]);

test('shared product blocks do not expose an L6-specific fallback', () => {
  [colorSwitcher, fullScreenIntro, productHero, productStickyNav].forEach((source) => {
    assert.doesNotMatch(source, /Li L6/i);
  });
  assert.match(productHero, /propText\(block, 'logoAlt'\) \|\| 'Vehicle'/);
  assert.match(fullScreenIntro, /\|\| 'Vehicle'/);
});

test('sticky navigation resolves the current product hero anchor', () => {
  assert.match(productStickyNav, /document\.querySelector\('main \.product-hero\[id\]'\)/);
  assert.match(productStickyNav, /`\$\{vehicleName\} sections`/);
});

test('color labels strip accessibility and Li model suffixes', () => {
  assert.match(colorSwitcher, /color swatch/);
  assert.match(colorSwitcher, /Li\\s\+\[A-Z0-9-\]\+/);
});
