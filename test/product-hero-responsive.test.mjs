import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [heroCss, heroJs, heroModel, productUtils] = await Promise.all([
  readFile(new URL('../blocks/product-hero/product-hero.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/product-hero/product-hero.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/product-hero/_product-hero.json', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/product-block-utils.js', import.meta.url), 'utf8'),
]);

test('hero scroll cue skips the removed L6 sticky navigation', () => {
  assert.match(heroJs, /classList\.contains\('product-sticky-nav-wrapper'\)/);
  assert.match(heroJs, /nextProductContent\(block\)\?\.scrollIntoView/);
  assert.match(heroJs, /prefersReducedMotion\(\) \? 'auto' : 'smooth'/);
});

test('product hero authors four responsive poster compositions', () => {
  const { models } = JSON.parse(heroModel);
  const hero = models.find(({ id }) => id === 'product-hero');
  const responsive = models.find(({ id }) => id === 'product-hero-responsive-media');
  assert.ok(hero.fields.some(({ name }) => name === 'image'));
  assert.ok(hero.fields.some(({ name }) => name === 'mobileImage'));
  assert.deepEqual(responsive.fields.map(({ name }) => name), ['mediumImage', 'tabletImage']);
});

test('responsive product hero sources use the official component breakpoints', () => {
  assert.match(productUtils, /appendResponsiveSources\(image, mediumImage \|\| image, '\(min-width: 821px\) and \(max-width: 1024px\)'\)/);
  assert.match(productUtils, /appendResponsiveSources\(image, tabletImage \|\| mediumImage \|\| image, '\(min-width: 721px\) and \(max-width: 820px\)'\)/);
  assert.match(
    productUtils,
    /appendResponsiveSources\(\s*image,\s*mobileImage \|\| tabletImage \|\| mediumImage \|\| image,\s*MOBILE_MEDIA_QUERY,\s*\)/,
  );
  assert.match(productUtils, /has-responsive-picture/);
});

test('medium and tablet hero geometry matches the official viewport rhythm', () => {
  assert.match(heroCss, /@media \(width >= 1025px\) and \(width <= 1440px\)/);
  assert.match(heroCss, /@media \(width >= 821px\) and \(width <= 1024px\)/);
  assert.match(heroCss, /@media \(width >= 721px\) and \(width <= 820px\)/);
  assert.match(heroCss, /min-height:\s*calc\(100svh - 50px\)/);
  assert.match(heroCss, /top:\s*calc\(7\.8125vw \+ 1\.5px\)/);
  assert.match(heroCss, /top:\s*calc\(7\.8125vw \+ 82px\)/);
});

test('mobile hero keeps the official tall composition and fixed logo geometry', () => {
  assert.match(heroCss, /@media \(width <= 720px\)/);
  assert.match(heroCss, /min-height:\s*max\(calc\(100svh - 50px\), 200vw\)/);
  assert.match(heroCss, /top:\s*calc\(32vw \+ 16px\)/);
  assert.match(heroCss, /width:\s*186\.7px/);
});

test('Universal Editor caps product hero height after responsive viewport rules', () => {
  const authorRule = '.adobe-ue-edit main .product-hero';
  assert.ok(
    heroCss.lastIndexOf(authorRule) > heroCss.lastIndexOf('@media (width <= 720px)'),
  );
  assert.match(
    heroCss,
    /\.adobe-ue-edit main \.product-hero\s*\{[^}]*min-height:\s*clamp\(720px, 100vh, 1080px\)/s,
  );
});
