import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const [
  blockCss,
  blockJs,
  modelSource,
  productUtils,
  sectionSource,
] = await Promise.all([
  readFile(new URL('../blocks/lixiang-product-detail-picture-group/lixiang-product-detail-picture-group.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-product-detail-picture-group/lixiang-product-detail-picture-group.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-product-detail-picture-group/_lixiang-product-detail-picture-group.json', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/product-block-utils.js', import.meta.url), 'utf8'),
  readFile(new URL('../models/_section.json', import.meta.url), 'utf8'),
]);

const config = JSON.parse(modelSource);
const model = (id) => config.models.find((entry) => entry.id === id);
const fields = (id) => Object.fromEntries(model(id).fields.map((field) => [field.name, field]));

test('product detail picture group uses one canonical namespace', async () => {
  const definitionIds = config.definitions.map(({ id }) => id);
  assert.deepEqual(definitionIds, [
    'lixiang-product-detail-picture-group',
    'lixiang-product-detail-picture-group-item',
    'lixiang-product-detail-picture-item',
  ]);
  assert.equal(
    config.definitions[0].plugins.xwalk.page.template.name,
    'Lixiang Product Detail Picture Group',
  );
  assert.match(sectionSource, /"lixiang-product-detail-picture-group"/);
  assert.match(productUtils, /'lixiang-product-detail-picture-group':/);
  assert.match(productUtils, /'lixiang-product-detail-picture-group-item':/);
  assert.match(productUtils, /'lixiang-product-detail-picture-item':/);
  await assert.rejects(
    access(new URL('../blocks/picture-group', import.meta.url)),
    /ENOENT/,
  );
});

test('dialog exposes only design-backed themes, spacing, copy, and media fields', () => {
  const container = fields('lixiang-product-detail-picture-group');
  const pictureSet = fields('lixiang-product-detail-picture-group-item');
  const picture = fields('lixiang-product-detail-picture-item');

  assert.deepEqual(Object.keys(container), [
    'id',
    'title',
    'description',
    'showVideoControl',
    'showProgress',
    'enableMotion',
    'classes',
  ]);
  assert.equal(container.title.component, 'text');
  assert.deepEqual(
    container.classes.options[0].children.map(({ value }) => value),
    ['light', 'gray'],
  );
  assert.deepEqual(
    container.classes.options[1].children.map(({ value }) => value),
    ['space-large', 'space-small', 'space-none'],
  );
  assert.deepEqual(
    container.classes.options[2].children.map(({ value }) => value),
    ['picture-gap-large', 'picture-gap-small'],
  );
  assert.deepEqual(Object.keys(pictureSet), ['groupKey', 'title', 'description']);
  assert.deepEqual(Object.keys(picture), [
    'image',
    'imageAlt',
    'mobileImage',
    'mobileImageAlt',
    'video',
    'mobileVideo',
    'title',
    'description',
  ]);
});

test('desktop and tablet use the approved 1480 by 1420 proportional mosaic', () => {
  assert.match(blockCss, /width:\s*min\(77\.0833vw, 1480px\)/);
  assert.match(blockCss, /aspect-ratio:\s*1480 \/ 1420/);
  assert.match(
    blockCss,
    /grid-template-rows:\s*46fr 2fr 14fr 2fr 30fr 2fr 14fr 2fr 30fr/,
  );
  assert.match(blockCss, /column-gap:\s*1\.3514%/);
  assert.match(blockCss, /nth-child\(1\)[\s\S]*grid-area:\s*1 \/ 1 \/ 4 \/ 3/);
  assert.match(blockCss, /nth-child\(2\)[\s\S]*grid-area:\s*5 \/ 1 \/ 8 \/ 3/);
  assert.match(blockCss, /nth-child\(5\)[\s\S]*grid-area:\s*1 \/ 3 \/ 2 \/ 5/);
  assert.match(blockCss, /nth-child\(8\)[\s\S]*grid-area:\s*7 \/ 3 \/ 10 \/ 5/);
});

test('mobile uses the approved 335 by 771 staggered mosaic without a header', () => {
  assert.match(blockCss, /@media \(width <= 719px\)/);
  assert.match(blockCss, /aspect-ratio:\s*335 \/ 771/);
  assert.match(
    blockCss,
    /grid-template-rows:\s*243fr 8fr 130fr 8fr 49fr 8fr 65fr 8fr 57fr 8fr 57fr 8fr 122fr/,
  );
  assert.match(blockCss, /@media \(width <= 719px\)[\s\S]*\.product-section-header\s*\{\s*\n\s*display:\s*none/);
  assert.match(blockCss, /nth-child\(4\)[\s\S]*grid-area:\s*11 \/ 1 \/ 14 \/ 2/);
  assert.match(blockCss, /nth-child\(6\)[\s\S]*grid-area:\s*5 \/ 2 \/ 8 \/ 3/);
  assert.match(blockCss, /nth-child\(8\)[\s\S]*grid-area:\s*13 \/ 2 \/ 14 \/ 3/);
});

test('component spacing and header geometry match all selected Pencil boards', () => {
  assert.match(blockCss, /\.space-large\s*\{\s*\n\s*padding-block:\s*160px/);
  assert.match(blockCss, /\.space-small\s*\{\s*\n\s*padding-block:\s*80px/);
  assert.match(blockCss, /@media \(width >= 720px\) and \(width <= 1440px\)[\s\S]*padding-block:\s*64px/);
  assert.match(blockCss, /@media \(width >= 720px\) and \(width <= 1440px\)[\s\S]*padding-block:\s*32px/);
  assert.match(blockCss, /@media \(width <= 719px\)[\s\S]*padding-block:\s*80px/);
  assert.match(blockCss, /@media \(width <= 719px\)[\s\S]*padding-block:\s*40px/);
  assert.match(blockCss, /width:\s*56\.7568%/);
  assert.match(blockCss, /margin:\s*0 0 80px 11\.0811%/);
  assert.match(blockCss, /font-size:\s*46px/);
  assert.match(blockCss, /font-size:\s*20px/);
});

test('parallax uses a centered 1.4x canvas and respects reduced motion', () => {
  assert.match(blockCss, /width:\s*140%/);
  assert.match(blockCss, /height:\s*140%/);
  assert.match(blockCss, /calc\(-14\.2857% \+ var\(--product-detail-picture-parallax\)\)/);
  assert.match(blockCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(blockJs, /if \(prefersReducedMotion\(\)\) return/);
  assert.match(blockJs, /productDetailPictureGroupMotion\?\.abort\(\)/);
  assert.match(blockJs, /addEventListener\('scroll', requestUpdate, \{ passive: true, signal: controller\.signal \}\)/);
});

test('rendering preserves flat sibling instrumentation, responsive media, and isolated controls', () => {
  assert.match(blockJs, /modelItems\(block, 'lixiang-product-detail-picture-group-item'\)/);
  assert.match(blockJs, /modelItems\(block, 'lixiang-product-detail-picture-item'\)/);
  assert.match(blockJs, /\[\.\.\.block\.children\]\.forEach/);
  assert.deepEqual(
    config.filters[0].components,
    [
      'lixiang-product-detail-picture-group-item',
      'lixiang-product-detail-picture-item',
    ],
  );
  assert.match(blockJs, /moveItemInstrumentation\(item, figure\)/);
  assert.match(blockJs, /moveItemInstrumentation\(group, panel\)/);
  assert.match(blockJs, /showControls:\s*propBoolean\(block, 'showVideoControl', true\)/);
  assert.match(blockJs, /setupTabs\(block, buttons, panels\)/);
  assert.match(productUtils, /loading !== 'lazy' && image\.complete/);
  assert.match(blockCss, /\.lixiang-product-detail-picture-group-tabs button:focus-visible/);
  assert.match(blockCss, /border-radius:\s*0/);
});
