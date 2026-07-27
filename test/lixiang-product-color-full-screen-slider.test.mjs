import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const blockUrl = new URL(
  '../blocks/lixiang-product-color-full-screen-slider/',
  import.meta.url,
);
const [blockJs, blockCss, blockModel, productUtils] = await Promise.all([
  readFile(new URL('lixiang-product-color-full-screen-slider.js', blockUrl), 'utf8'),
  readFile(new URL('lixiang-product-color-full-screen-slider.css', blockUrl), 'utf8'),
  readFile(new URL('_lixiang-product-color-full-screen-slider.json', blockUrl), 'utf8'),
  readFile(new URL('../scripts/product-block-utils.js', import.meta.url), 'utf8'),
]);

test('full-screen color slider keeps an independent block model', () => {
  const model = JSON.parse(blockModel);
  assert.equal(model.definitions[0].id, 'lixiang-product-color-full-screen-slider');
  assert.equal(model.models[0].id, 'lixiang-product-color-full-screen-slider');
  assert.deepEqual(model.filters[0].components, ['color-switcher-item']);
  assert.match(productUtils, /'lixiang-product-color-full-screen-slider': 'color-switcher-item'/);
});

test('full-screen color slider preserves responsive media and swatches', () => {
  assert.match(blockJs, /pictureAspectRatio/);
  assert.match(blockJs, /color swatch/);
  assert.match(blockJs, /instrumentProp\(item, 'mobileImage', mobile\)/);
  assert.match(blockJs, /moveItemInstrumentation\(item, panel\)/);
});

test('full-screen color slider exposes accessible manual controls', () => {
  assert.match(blockJs, /setAttribute\('role', 'tablist'\)/);
  assert.match(blockJs, /ArrowRight/);
  assert.match(blockJs, /aria-selected/);
  assert.match(blockCss, /opacity 500ms ease-in-out/);
});

test('full-screen color slider matches desktop and mobile design ratios', () => {
  assert.match(blockCss, /aspect-ratio: 16 \/ 9/);
  assert.match(blockCss, /aspect-ratio: 3 \/ 4/);
  assert.match(blockCss, /width: calc\(100% - 24px\);[\s\S]*justify-content: space-between/);
  assert.match(blockCss, /\.adobe-ue-edit[\s\S]*max-height: 1080px/);
});
