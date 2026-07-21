import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [
  carouselCss,
  carouselJs,
  carouselModelSource,
  productUtils,
  productBlockCss,
] = await Promise.all([
  readFile(new URL('../blocks/highlight-carousel/highlight-carousel.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/highlight-carousel/highlight-carousel.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/highlight-carousel/_highlight-carousel.json', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/product-block-utils.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles/product-blocks.css', import.meta.url), 'utf8'),
]);
const carouselConfig = JSON.parse(carouselModelSource);
const carouselModel = carouselConfig.models.find(({ id }) => id === 'highlight-carousel');
const slideModel = carouselConfig.models.find(({ id }) => id === 'highlight-slide');

test('highlight carousel keeps copy inside its 16:9 media container', () => {
  assert.match(carouselJs, /media\.append\(copy\)/);
  assert.match(carouselCss, /width:\s*1200px;\s*\n\s*height:\s*674px/);
  assert.match(carouselCss, /width:\s*900px;[\s\S]*height:\s*505\.5px/);
  assert.match(carouselCss, /width:\s*630px;[\s\S]*height:\s*354px/);
});

test('highlight carousel uses the official four responsive geometry bands', () => {
  assert.match(carouselCss, /@media \(width >= 1025px\) and \(width <= 1440px\)/);
  assert.match(carouselCss, /@media \(width >= 721px\) and \(width <= 1024px\)/);
  assert.match(carouselCss, /@media \(width <= 720px\)/);
  assert.match(carouselCss, /\.space-large\s*\{\s*\n\s*padding-block:\s*80px/);
  assert.match(carouselCss, /\.space-small\s*\{\s*\n\s*padding-block:\s*60px/);
  assert.match(productBlockCss, /@media \(width >= 720px\)[\s\S]*\.space-large\s*\{\s*\n\s*padding-block:\s*160px/);
  assert.match(productBlockCss, /@media \(width >= 720px\)[\s\S]*\.space-small\s*\{\s*\n\s*padding-block:\s*80px/);
  assert.doesNotMatch(carouselCss, /padding-block:\s*11\.9048vw/);
});

test('highlight carousel exposes clickable progress dots and accessible arrow controls', () => {
  assert.match(carouselJs, /dots\.append\(\.\.\.dotButtons\)/);
  assert.match(carouselJs, /dot\.setAttribute\('aria-current', 'true'\)/);
  assert.match(carouselCss, /\.highlight-dot\.is-active/);
  assert.match(carouselCss, /width:\s*46px;\s*\n\s*height:\s*46px/);
});

test('highlight carousel hides non-participating slides and keeps authored media colors intact', () => {
  assert.match(carouselCss, /\.highlight-slide\s*\{[\s\S]*visibility:\s*hidden/);
  assert.match(carouselCss, /\.highlight-slide\.is-active\s*\{[\s\S]*visibility:\s*visible/);
  assert.doesNotMatch(carouselCss, /linear-gradient\(180deg, rgb\(0 0 0 \/ 34%\)/);
  assert.doesNotMatch(carouselJs, /\.product-section-header, \.highlight-slide/);
});

test('tablet carousel corrects wrapper padding and centers arrow glyphs', () => {
  assert.match(carouselCss, /@media \(width >= 721px\) and \(width <= 899px\)[\s\S]*width:\s*calc\(100% \+ 48px\);[\s\S]*margin-inline-start:\s*-24px/);
  assert.match(carouselCss, /@media \(width >= 900px\) and \(width <= 1024px\)[\s\S]*width:\s*calc\(100% \+ 64px\);[\s\S]*margin-inline-start:\s*-32px/);
  assert.match(carouselCss, /top:\s*50%;\s*\n\s*left:\s*50%/);
  assert.match(carouselCss, /translate\(-50%, -50%\) rotate\(45deg\)/);
});

test('desktop carousel matches the official 300ms motion and stages non-participating slides instantly', () => {
  assert.match(carouselCss, /transition:\s*opacity 300ms ease, transform 300ms ease/);
  assert.match(carouselCss, /\.highlight-slide\.is-instant\s*\{\s*\n\s*transition:\s*none/);
  assert.match(carouselJs, /index === previousActive \|\| index === active/);
  assert.match(carouselJs, /slide\.classList\.toggle\('is-instant', !participatesInTransition\)/);
});

test('mobile carousel disables autoplay and equalizes card copy height', () => {
  assert.match(carouselJs, /matchMedia\('\(width <= 720px\)'\)/);
  assert.match(carouselCss, /align-items:\s*stretch/);
  assert.match(carouselCss, /height:\s*100%;\s*\n\s*min-height:\s*0;\s*\n\s*flex:\s*1 1 auto/);
  assert.doesNotMatch(carouselCss, /min-height:\s*(230|270)px/);
  assert.match(carouselCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(carouselCss, /@media \(width <= 720px\)[\s\S]*visibility:\s*visible/);
});

test('highlight carousel dialog exposes multiline titles, semantic colors, spacing, and video controls', () => {
  const fields = Object.fromEntries(carouselModel.fields.map((field) => [field.name, field]));
  assert.equal(fields.title.component, 'textarea');
  assert.equal(fields.mobileTitle.component, 'textarea');
  assert.equal(fields.showVideoControl.component, 'boolean');
  assert.equal(fields.showVideoControl.value, true);
  assert.equal(fields.showProgress.label, 'Show Video Progress');
  assert.deepEqual(fields.headingColor.options.map(({ value }) => value), ['white', 'black']);
  assert.deepEqual(fields.classes.options[0].children.map(({ value }) => value), ['light', 'dark', 'gray']);
  assert.deepEqual(fields.classes.options[1].children.map(({ value }) => value), ['space-large', 'space-small', 'space-none']);
});

test('highlight slide dialog exposes optional copy color, note toggle, and indicator label', () => {
  const fields = Object.fromEntries(slideModel.fields.map((field) => [field.name, field]));
  assert.equal(fields.title.component, 'textarea');
  assert.equal(fields.note.component, 'textarea');
  assert.deepEqual(fields.copyColor.options.map(({ value }) => value), ['white', 'black']);
  assert.equal(fields.showNote.component, 'boolean');
  assert.equal(fields.showNote.value, true);
  assert.equal(fields.indicatorLabel.component, 'textarea');
  assert.ok(slideModel.fields.findIndex(({ name }) => name === 'copyColor') > slideModel.fields.findIndex(({ name }) => name === 'linkType'));
  assert.match(productUtils, /\['copyColor', 'select'\], \['showNote', 'boolean'\], \['indicatorLabel', 'textarea'\]/);
});

test('highlight dialog fields are wired to rendered colors, notes, indicators, and video controls', () => {
  assert.match(carouselJs, /showControls:\s*propBoolean\(block, 'showVideoControl', true\)/);
  assert.match(carouselJs, /showNoteValue \? propBoolean\(item, 'showNote'\) : Boolean\(note\)/);
  assert.match(carouselJs, /highlight-copy-\$\{copyColor\}/);
  assert.match(carouselJs, /instrumentProp\(items\[index\], 'indicatorLabel', label\)/);
  assert.match(carouselCss, /white-space:\s*pre-line/);
  assert.match(carouselCss, /var\(--highlight-indicator, #191919\)/);
});

test('highlight videos loop in place with accessible controls and a true progress ring', () => {
  assert.match(carouselJs, /autoplay:\s*true/);
  assert.match(carouselJs, /const autoPlay = propBoolean\(block, 'autoPlay', true\)/);
  assert.match(carouselJs, /if \(!autoPlay \|\| slides\.length < 2/);
  assert.match(productUtils, /video\.loop = loop/);
  assert.match(productUtils, /button\.classList\.toggle\('is-playing', playing\)/);
  assert.match(productUtils, /requestAnimationFrame\(animateProgress\)/);
  assert.match(productUtils, /video\.dataset\.userPaused = 'true'/);
  assert.doesNotMatch(productUtils, /icon\.textContent = playing/);
  assert.match(productBlockCss, /\.product-video-control\s*\{[\s\S]*width:\s*56px;[\s\S]*height:\s*56px;[\s\S]*margin:\s*0/);
  assert.match(productBlockCss, /\.product-video-control\.has-progress::before\s*\{[\s\S]*conic-gradient[\s\S]*mask:\s*radial-gradient/);
  assert.doesNotMatch(productBlockCss, /\.product-video-control\.has-progress\s*\{[^}]*background:\s*conic-gradient/);
});
