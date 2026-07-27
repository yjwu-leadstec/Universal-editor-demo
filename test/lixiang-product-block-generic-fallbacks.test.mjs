import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [
  colorFullScreenSlider,
  fullScreenIntro,
  productHero,
  productStickyNav,
] = await Promise.all([
  readFile(new URL('../blocks/lixiang-product-color-full-screen-slider/lixiang-product-color-full-screen-slider.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-product-full-screen-intro/lixiang-product-full-screen-intro.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-product-hero/lixiang-product-hero.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-product-sticky-nav/lixiang-product-sticky-nav.js', import.meta.url), 'utf8'),
]);

test('shared product blocks do not expose an L6-specific fallback', () => {
  [colorFullScreenSlider, fullScreenIntro, productHero, productStickyNav].forEach((source) => {
    assert.doesNotMatch(source, /Li L6/i);
  });
  assert.match(productHero, /propText\(block, 'logoAlt'\) \|\| 'Vehicle'/);
  assert.match(fullScreenIntro, /\|\| 'Vehicle'/);
});

test('sticky navigation resolves the current product hero anchor', () => {
  assert.match(productStickyNav, /document\.querySelector\('main \.lixiang-product-hero\[id\]'\)/);
  assert.match(productStickyNav, /`\$\{vehicleName\} sections`/);
});

test('color labels strip accessibility and Li model suffixes', () => {
  assert.match(colorFullScreenSlider, /color swatch/);
  assert.match(colorFullScreenSlider, /Li\\s\+\[A-Z0-9-\]\+/);
});
