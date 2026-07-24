import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const blockUrl = new URL(
  '../blocks/lixiang-product-intro-carousel/',
  import.meta.url,
);
const [
  blockCss,
  blockJs,
  blockModelSource,
  productCss,
  productUtils,
  componentDefinitionSource,
  componentModelsSource,
  componentFiltersSource,
] = await Promise.all([
  readFile(new URL('lixiang-product-intro-carousel.css', blockUrl), 'utf8'),
  readFile(new URL('lixiang-product-intro-carousel.js', blockUrl), 'utf8'),
  readFile(new URL('_lixiang-product-intro-carousel.json', blockUrl), 'utf8'),
  readFile(new URL('../styles/product-blocks.css', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/product-block-utils.js', import.meta.url), 'utf8'),
  readFile(new URL('../component-definition.json', import.meta.url), 'utf8'),
  readFile(new URL('../component-models.json', import.meta.url), 'utf8'),
  readFile(new URL('../component-filters.json', import.meta.url), 'utf8'),
]);
const blockModel = JSON.parse(blockModelSource);

test('uses only the canonical component identity after content migration', async () => {
  const canonicalDefinition = blockModel.definitions[0];
  const canonicalTemplate = canonicalDefinition.plugins.xwalk.page.template;
  assert.equal(canonicalDefinition.id, 'lixiang-product-intro-carousel');
  assert.equal(canonicalTemplate.name, 'Lixiang Product Intro Carousel');
  assert.equal(
    canonicalTemplate.name.toLowerCase().replaceAll(' ', '-'),
    canonicalDefinition.id,
  );
  assert.equal(blockModel.models[0].id, 'lixiang-product-intro-carousel');
  await assert.rejects(
    readFile(
      new URL(
        '../blocks/feature-media-section/feature-media-section.js',
        import.meta.url,
      ),
    ),
    { code: 'ENOENT' },
  );
  await assert.rejects(
    readFile(
      new URL(
        '../blocks/feature-media-section/feature-media-section.css',
        import.meta.url,
      ),
    ),
    { code: 'ENOENT' },
  );
  assert.doesNotMatch(blockJs, /feature-media-section|feature-media-item|feature-stat-item/);
  assert.doesNotMatch(productUtils, /feature-media-section|feature-media-item|feature-stat-item/);
  assert.doesNotMatch(
    [componentDefinitionSource, componentModelsSource, componentFiltersSource].join('\n'),
    /feature-media-section|feature-media-item|feature-stat-item/,
  );
});

test('models slides, grouped top highlights, and bottom metrics separately', () => {
  const definitionIds = blockModel.definitions.map(({ id }) => id);
  const modelIds = blockModel.models.map(({ id }) => id);
  const filterById = Object.fromEntries(
    blockModel.filters.map((filter) => [filter.id, filter.components]),
  );
  assert.deepEqual(definitionIds, [
    'lixiang-product-intro-carousel',
    'lixiang-product-intro-slide',
    'lixiang-product-intro-highlight-group',
    'lixiang-product-intro-highlight',
    'lixiang-product-intro-metric',
  ]);
  assert.deepEqual(modelIds, definitionIds);
  assert.deepEqual(filterById['lixiang-product-intro-highlight-group'], [
    'lixiang-product-intro-highlight',
  ]);
  assert.deepEqual(filterById['lixiang-product-intro-carousel'], [
    'lixiang-product-intro-slide',
    'lixiang-product-intro-highlight-group',
    'lixiang-product-intro-metric',
  ]);
  assert.match(blockJs, /itemsFor\(group, ITEM_MODELS\.highlights\)/);
  assert.match(blockJs, /createBottomMetrics\(bottomMetricItems\)/);
});

test('container header fields never leak from nested slides or highlights', () => {
  assert.match(blockJs, /function directPropSource\(root, name\)/);
  assert.match(blockJs, /\[\.\.\.root\.children\]\.find/);
  assert.match(blockJs, /const header = createIntroHeader\(block\)/);
  assert.doesNotMatch(blockJs, /createSectionHeader/);
});

test('keeps source-backed variants and removes the unsupported overlay option', () => {
  const variant = blockModel.models[0].fields.find(({ name }) => name === 'variant');
  assert.deepEqual(variant.options.map(({ value }) => value), [
    'default',
    'overview',
    'three-up',
    'image-grid',
    'expandable',
    'primary-metric',
    'stat',
  ]);
  assert.doesNotMatch(blockModelSource, /"value": "overlay-tabs"/);
  assert.doesNotMatch(blockJs, /overlay-tabs/);
});

test('uses theme variables for tabs, copy, and divider rules', () => {
  assert.match(blockCss, /--product-intro-divider:\s*rgb\(0 0 0 \/ 10%\)/);
  assert.match(blockCss, /\.dark,[\s\S]*\.light-copy[\s\S]*--product-intro-divider:\s*rgb\(255 255 255 \/ 20%\)/);
  assert.match(blockCss, /\.feature-media-tab\[aria-selected="true"\]\s*\{[\s\S]*color:\s*var\(--product-copy\)/);
  assert.match(blockCss, /\.feature-media-tab-copy\s*\{[\s\S]*color:\s*var\(--product-muted\)/);
  assert.doesNotMatch(blockCss, /\.feature-media-tab\[aria-selected="true"\]\s*\{[^}]*color:\s*#191919/);
  assert.doesNotMatch(blockCss, /\.feature-media-tab-copy\s*\{[^}]*color:\s*#8c8c8c/);
});

test('preserves all spacing presets without component breakpoint overrides', () => {
  assert.match(productCss, /\.space-large\s*\{[\s\S]*padding-block:\s*80px/);
  assert.match(productCss, /\.space-small\s*\{[\s\S]*padding-block:\s*60px/);
  assert.match(productCss, /@media \(width >= 720px\)[\s\S]*\.space-large\s*\{[\s\S]*padding-block:\s*160px/);
  assert.match(productCss, /@media \(width >= 720px\)[\s\S]*\.space-small\s*\{[\s\S]*padding-block:\s*80px/);
  assert.doesNotMatch(blockCss, /\.variant-default\.is-tabbed\s*\{[^}]*padding-block/);
});

test('honors the selected ratio on desktop and mobile', () => {
  assert.match(blockCss, /--product-intro-ratio:\s*16 \/ 9/);
  assert.match(blockCss, /\.ratio-235-100 \.product-media\s*\{[\s\S]*--product-intro-ratio:\s*2\.35 \/ 1/);
  assert.match(blockCss, /\.ratio-4-3 \.product-media\s*\{[\s\S]*--product-intro-ratio:\s*4 \/ 3/);
  assert.match(blockCss, /\.variant-default \.product-media\s*\{[\s\S]*aspect-ratio:\s*var\(--product-intro-ratio\)/);
  assert.doesNotMatch(blockCss, /height:\s*min\(43\.3333vw,\s*832px\)/);
  assert.doesNotMatch(blockCss, /aspect-ratio:\s*335 \/ 197/);
});

test('single-slide default sections keep the product intro geometry without empty tabs', () => {
  assert.match(blockCss, /\.variant-default \.feature-media-shell\s*\{/);
  assert.match(blockCss, /\.variant-default \.product-section-header\s*\{/);
  assert.doesNotMatch(blockCss, /\.variant-default\.is-tabbed \.feature-media-shell\s*\{/);
  assert.match(blockJs, /if \(items\.length === 1\)/);
  assert.match(blockJs, /feature-media-single-copy/);
});

test('expands tab indicators with long labels while preserving the 98px minimum', () => {
  assert.match(blockCss, /\.feature-media-tabs \.feature-media-tab\s*\{[\s\S]*width:\s*max-content[\s\S]*min-width:\s*98px/);
  assert.match(blockCss, /\.feature-media-tabs \.feature-media-tab::after\s*\{[\s\S]*width:\s*100%/);
  assert.match(blockCss, /background:\s*var\(--product-accent\)/);
});

test('renders attached metrics with matching media corners', () => {
  assert.match(blockCss, /\.product-intro-bottom-metrics\s*\{[^}]*border-radius:\s*0 0 4px 4px/);
  assert.match(blockCss, /\.product-intro-bottom-metrics\s*\{[^}]*grid-auto-flow:\s*column/);
  assert.match(blockCss, /\.variant-default\.has-bottom-metrics \.product-media\s*\{[\s\S]*border-radius:\s*4px 4px 0 0/);
  assert.match(blockCss, /@media \(width <= 820px\)[\s\S]*\.product-intro-bottom-metrics\s*\{[\s\S]*margin-inline:\s*20px/);
});

test('uses unique ARIA IDs and respects reduced motion', () => {
  assert.match(blockJs, /lixiang-product-intro-carousel-\$\{carouselInstance \+= 1\}/);
  assert.match(blockJs, /motionQuery = window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(blockJs, /motionQuery\.matches/);
  assert.match(blockJs, /motionQuery\.addEventListener\('change', applyMode\)/);
  assert.match(blockJs, /prefersReducedMotion\(\) \? 'auto' : 'smooth'/);
});

test('keeps desktop autoplay and mobile manual swipe behavior', () => {
  assert.match(blockJs, /if \(!autoPlay \|\| mobileQuery\.matches \|\| motionQuery\.matches/);
  assert.match(blockCss, /@media \(width <= 820px\)[\s\S]*overflow-x:\s*auto[\s\S]*scroll-snap-type:\s*x mandatory/);
  assert.match(blockJs, /viewport\.addEventListener\('scroll'/);
});
