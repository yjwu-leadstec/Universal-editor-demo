import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [
  carouselCss,
  carouselJs,
  carouselModelSource,
  productUtils,
  editorSupport,
] = await Promise.all([
  readFile(new URL('../blocks/lixiang-product-intro-slider/lixiang-product-intro-slider.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-product-intro-slider/lixiang-product-intro-slider.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-product-intro-slider/_lixiang-product-intro-slider.json', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-product-intro-slider/slider-utils.js', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/editor-support.js', import.meta.url), 'utf8'),
]);
const carouselConfig = JSON.parse(carouselModelSource);
const carouselModel = carouselConfig.models.find(({ id }) => id === 'lixiang-product-intro-slider');
const slideModel = carouselConfig.models.find(({ id }) => id === 'highlight-slide');
const carouselDefinition = carouselConfig.definitions.find(({ id }) => id === 'lixiang-product-intro-slider');

test('highlight carousel keeps overlay copy in media and renders notes in the reserved footer gap', () => {
  assert.match(carouselJs, /media\.append\(copy\)/);
  assert.match(carouselJs, /if \(noteElement\) slide\.append\(noteElement\)/);
  assert.match(carouselCss, /width:\s*1200px;\s*\n\s*height:\s*674px/);
  assert.match(carouselCss, /width:\s*900px;[\s\S]*height:\s*505\.5px/);
  assert.match(carouselCss, /width:\s*630px;[\s\S]*height:\s*354px/);
  assert.match(carouselCss, /\.highlight-note\s*\{[\s\S]*top:\s*688px;[\s\S]*line-height:\s*16px/);
  assert.match(carouselCss, /@media \(width <= 720px\)[\s\S]*\.highlight-note\s*\{[\s\S]*position:\s*static/);
});

test('highlight carousel uses the official four responsive geometry bands', () => {
  assert.match(carouselCss, /@media \(width >= 1025px\) and \(width <= 1440px\)/);
  assert.match(carouselCss, /@media \(width >= 721px\) and \(width <= 1024px\)/);
  assert.match(carouselCss, /@media \(width <= 720px\)/);
  assert.match(carouselCss, /\.space-large\s*\{\s*\n\s*padding-block:\s*80px/);
  assert.match(carouselCss, /\.space-small\s*\{\s*\n\s*padding-block:\s*60px/);
  assert.match(carouselCss, /@media \(width >= 720px\)[\s\S]*\.space-large\s*\{\s*\n\s*padding-block:\s*160px/);
  assert.match(carouselCss, /@media \(width >= 720px\)[\s\S]*\.space-small\s*\{\s*\n\s*padding-block:\s*80px/);
  assert.doesNotMatch(carouselCss, /padding-block:\s*11\.9048vw/);
});

test('highlight carousel exposes clickable progress dots and accessible arrow controls', () => {
  assert.match(carouselJs, /dots\.append\(\.\.\.dotButtons\)/);
  assert.match(carouselJs, /dot\.setAttribute\('aria-current', 'true'\)/);
  assert.match(carouselCss, /\.highlight-dot\.is-active/);
  assert.match(carouselCss, /width:\s*46px;\s*\n\s*height:\s*46px/);
  assert.doesNotMatch(carouselJs, /Pause slide rotation/);
  assert.doesNotMatch(carouselJs, /highlight-rotation-control/);
  assert.match(carouselJs, /listen\(shell, 'focusin', \(\) => \{\s*\n\s*pauseRotation\(\);/);
  assert.match(carouselJs, /const sectionTitle = propText\(block, 'title'\)/);
  assert.match(carouselJs, /viewport\.setAttribute\('aria-label', sectionTitle\.replaceAll/);
});

test('highlight carousel lays slides out as one strip and keeps authored media colors intact', () => {
  // Slides sit side by side; the track moves them, so no slide is hidden or
  // positioned on its own. Each is one step wide rather than 100% of the track,
  // because loop clones make the track wider than a single slide.
  assert.match(carouselCss, /\.highlight-slide\s*\{[\s\S]*flex:\s*0 0 var\(--highlight-step/);
  assert.doesNotMatch(carouselCss, /\.highlight-slide\.is-(previous|next)\s*\{/);
  assert.doesNotMatch(carouselCss, /linear-gradient\(180deg, rgb\(0 0 0 \/ 34%\)/);
  assert.doesNotMatch(carouselJs, /\.product-section-header, \.highlight-slide/);
});

test('tablet carousel corrects wrapper padding and centers arrow glyphs', () => {
  assert.match(carouselCss, /@media \(width >= 721px\) and \(width <= 899px\)[\s\S]*width:\s*calc\(100% \+ 48px\);[\s\S]*margin-inline-start:\s*-24px/);
  assert.match(carouselCss, /@media \(width >= 900px\) and \(width <= 1024px\)[\s\S]*width:\s*calc\(100% \+ 64px\);[\s\S]*margin-inline-start:\s*-32px/);
  assert.match(carouselCss, /top:\s*50%;\s*\n\s*left:\s*50%/);
  assert.match(carouselCss, /translate\(-50%, -50%\) rotate\(45deg\)/);
  assert.match(carouselJs, /--highlight-slide-count', slides\.length/);
  assert.match(carouselCss, /@media \(width >= 721px\) and \(width <= 1440px\)[\s\S]*width:\s*calc\(100% - 190px\);[\s\S]*repeat\(var\(--highlight-slide-count\), minmax\(0, 1fr\)\)/);
});

test('desktop carousel moves the whole track rather than repositioning each slide', () => {
  // One transform on the track drives every card, so they travel together and
  // an entering card can never appear to grow out of an edge.
  assert.match(carouselCss, /\.highlight-track\s*\{[\s\S]*50cqw - var\(--highlight-step\) \/ 2 - var\(--active-slide, 0\) \* var\(--highlight-step\)/);
  // The strip is wider than the viewport, so it is centred against the clip
  // box in container units rather than by margin auto (which would pin the
  // first card to the left edge) or `left` (which would compound with the
  // viewport's own full-bleed shift).
  assert.match(carouselCss, /\.highlight-viewport\s*\{[\s\S]*container-type:\s*inline-size/);
  assert.match(carouselCss, /\.highlight-track\s*\{[\s\S]*transition:\s*transform/);
  assert.match(carouselCss, /\.highlight-track\.is-instant\s*\{\s*\n\s*transition:\s*none/);
  assert.match(carouselJs, /track\.style\.setProperty\('--active-slide', position\)/);
  // Only the first paint skips the animation.
  assert.match(carouselJs, /track\.classList\.toggle\('is-instant', !rendered\)/);
  assert.match(carouselJs, /releaseFrame = window\.requestAnimationFrame/);
  assert.match(carouselCss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.highlight-track\s*\{\s*\n\s*transition:\s*none/);
  // Each breakpoint steps by its own card width, so the step is a variable.
  assert.match(carouselCss, /--highlight-step:\s*940px/);
  assert.match(carouselCss, /--highlight-step:\s*670px/);
});

test('carousel loops through edge clones so both neighbours always peek', () => {
  // A linear strip shows nothing past either end: at slide 0 no card peeked on
  // the left, and wrapping swept the whole track instead of stepping one card.
  // Clone the last slide before the first and the first after the last, then
  // snap from the clone to the real slide with the transition suppressed.
  assert.match(carouselJs, /const headClone = looped \? cloneSlide\(slides\[slides\.length - 1\]\) : null/);
  assert.match(carouselJs, /const tailClone = looped \? cloneSlide\(slides\[0\]\) : null/);
  assert.match(carouselJs, /track\.append\(headClone, \.\.\.slides, tailClone\)/);
  // Clones are decorative: no editor instrumentation and no duplicate video.
  assert.match(carouselJs, /clone\.querySelectorAll\('video, \.product-video-control'\)/);
  assert.match(carouselJs, /key\.startsWith\('aue'\) \|\| key\.startsWith\('richtext'\)/);
  // The strip is offset by one slide, so position = real index + 1.
  assert.match(carouselJs, /const offset = looped \? 1 : 0/);
  assert.match(carouselJs, /settleWrap\(active \+ offset\)/);
  assert.match(carouselJs, /const WRAP_SETTLE_MS = 400/);
  // Mobile scrolls natively, so clones are hidden and the step transform reset.
  assert.match(carouselCss, /@media \(width <= 720px\)[\s\S]*\.highlight-slide\.is-clone\s*\{\s*\n\s*display:\s*none/);
});

test('mobile carousel disables autoplay and equalizes card copy height', () => {
  assert.match(carouselJs, /const MOBILE_QUERY = '\(width <= 720px\)'/);
  assert.match(carouselJs, /matchMedia\(MOBILE_QUERY\)/);
  assert.match(carouselCss, /align-items:\s*stretch/);
  assert.match(carouselCss, /height:\s*100%;\s*\n\s*min-height:\s*0;\s*\n\s*flex:\s*1 1 auto/);
  assert.doesNotMatch(carouselCss, /min-height:\s*(230|270)px/);
  assert.match(carouselCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  // Mobile scrolls the strip natively: slides take the viewport width and snap.
  assert.match(carouselCss, /@media \(width <= 720px\)[\s\S]*scroll-snap-align:\s*start/);
  assert.match(carouselCss, /@media \(width <= 720px\)[\s\S]*scroll-snap-type:\s*x mandatory/);
});

test('highlight carousel dialog exposes multiline titles, semantic colors, spacing, and video controls', () => {
  const fields = Object.fromEntries(carouselModel.fields.map((field) => [field.name, field]));
  assert.equal(fields.title.component, 'textarea');
  assert.equal(fields.mobileTitle.component, 'textarea');
  assert.equal(fields.showVideoControl.component, 'boolean');
  assert.equal(fields.showVideoControl.value, true);
  assert.equal(fields.showProgress.label, 'Show Video Progress');
  // Background and spacing are separate selects rather than one combined
  // `classes` multiselect, so the author picks each independently.
  assert.equal(fields.classes, undefined);
  assert.equal(fields.background.component, 'select');
  assert.deepEqual(
    fields.background.options.map(({ value }) => value),
    ['light', 'dark', 'gray'],
  );
  assert.equal(fields.spacing.component, 'select');
  assert.deepEqual(
    fields.spacing.options.map(({ value }) => value),
    ['space-large', 'space-small', 'space-none'],
  );
  const { template } = carouselDefinition.plugins.xwalk.page;
  assert.equal(template.background, 'light');
  assert.equal(template.spacing, 'space-small');
  // Heading colour follows the background, so there is no manual override.
  assert.equal(fields.headingColor, undefined);
  assert.match(carouselJs, /block\.classList\.add\(background\)/);
  assert.match(carouselJs, /block\.classList\.add\(spacing\)/);
});

test('highlight slide dialog exposes optional copy color, note toggle, and indicator label', () => {
  const fields = Object.fromEntries(slideModel.fields.map((field) => [field.name, field]));
  assert.equal(fields.title.component, 'textarea');
  assert.equal(fields.note.component, 'textarea');
  assert.deepEqual(fields.copyColor.options.map(({ value }) => value), ['white', 'black']);
  assert.equal(fields.showNote.component, 'boolean');
  assert.equal(fields.showNote.value, true);
  assert.equal(fields.indicatorLabel.component, 'textarea');
  assert.equal(fields.metrics, undefined);
  assert.ok(slideModel.fields.findIndex(({ name }) => name === 'copyColor') > slideModel.fields.findIndex(({ name }) => name === 'linkType'));
  // Field entries carry [name, component, label]; the label feeds data-aue-label
  // so the content tree can name the field instead of falling back to the raw key.
  assert.match(productUtils, /\['copyColor', 'select', '[^']+'\], \['showNote', 'boolean', '[^']+'\], \['indicatorLabel', 'textarea', '[^']+'\]/);
  assert.match(productUtils, /source\.dataset\.aueLabel = label/);
  assert.match(productUtils, /source\.dataset\.aueType = component/);
});

test('highlight dialog fields are wired to rendered colors, notes, indicators, and video controls', () => {
  assert.match(carouselJs, /showControls:\s*propBoolean\(block, 'showVideoControl', true\)/);
  assert.match(carouselJs, /propBoolean\(item, 'showNote', Boolean\(note\)\)/);
  assert.match(carouselJs, /highlight-copy-\$\{copyColor\}/);
  assert.match(carouselJs, /instrumentProp\(items\[index\], 'indicatorLabel', label\)/);
  assert.match(carouselCss, /white-space:\s*pre-line/);
  assert.match(carouselCss, /var\(--highlight-indicator, #191919\)/);
});

test('highlight videos loop in place with accessible controls and a true progress ring', () => {
  assert.match(carouselJs, /autoplay:\s*true/);
  assert.match(carouselJs, /const autoPlay = propBoolean\(block, 'autoPlay', true\)/);
  assert.match(carouselJs, /\|\| !autoPlay/);
  assert.match(carouselJs, /\|\| slides\.length < 2/);
  assert.match(productUtils, /video\.loop = loop/);
  assert.match(productUtils, /button\.classList\.toggle\('is-playing', playing\)/);
  assert.match(productUtils, /requestAnimationFrame\(animateProgress\)/);
  assert.match(productUtils, /video\.dataset\.userPaused = 'true'/);
  assert.match(productUtils, /isActive && hasActiveSource\(\)/);
  assert.match(productUtils, /observer\?\.disconnect\(\)/);
  assert.match(productUtils, /let failedSources = new WeakSet\(\)/);
  assert.match(productUtils, /source\.addEventListener\('error', handleSourceError/);
  assert.match(productUtils, /!source\.media \|\| window\.matchMedia\(source\.media\)\.matches/);
  assert.match(productUtils, /eligibleSources\.some\(\(source\) => !failedSources\.has\(source\)\)/);
  assert.match(productUtils, /return \{ element: media, video, \.\.\.playback \}/);
  assert.match(carouselJs, /slideEntries\[index\]\.setMediaActive\(!inactive\)/);
  assert.doesNotMatch(productUtils, /icon\.textContent = playing/);
  assert.match(carouselCss, /\.product-video-control\s*\{[\s\S]*width:\s*52px;[\s\S]*height:\s*52px;[\s\S]*margin:\s*0/);
  assert.match(carouselCss, /\.product-video-control\.has-progress::before\s*\{[\s\S]*conic-gradient[\s\S]*mask:\s*radial-gradient/);
  assert.doesNotMatch(carouselCss, /\.product-video-control\.has-progress\s*\{[^}]*background:\s*conic-gradient/);
});

test('highlight carousel cleans up editor instances and falls back when scrollend is unavailable', () => {
  assert.match(carouselJs, /carouselInstances\.get\(block\)\?\.\(\)/);
  assert.match(carouselJs, /listen\(block, 'aem:block-unload', cleanup/);
  assert.match(carouselJs, /slideEntries\.forEach\(\(\{ destroyMedia \}\) => destroyMedia\(\)\)/);
  assert.match(carouselJs, /if \('onscrollend' in viewport\)/);
  assert.match(carouselJs, /listen\(viewport, 'scroll',/);
  assert.match(carouselJs, /window\.setTimeout\(\(\) => \{[\s\S]*syncMobileScroll\(\);[\s\S]*\}, 120\)/);
  assert.match(editorSupport, /block\.dispatchEvent\(new CustomEvent\('aem:block-unload'\)\)/);
  assert.match(editorSupport, /unloadBlocks\(block\);\s*\n\s*block\.remove\(\)/);
});

test('editor patches share one DOMPurify load while concurrent updates are pending', () => {
  assert.match(editorSupport, /let domPurifyPromise/);
  assert.match(editorSupport, /if \(!domPurifyPromise\) \{/);
  assert.match(editorSupport, /domPurifyPromise = loadScript\(/);
  assert.match(editorSupport, /const domPurify = await loadDOMPurify\(\)/);
  assert.match(editorSupport, /domPurify\.sanitize\(content/);
  assert.doesNotMatch(editorSupport, /window\.DOMPurify\.sanitize\(content/);
});

test('inactive carousel slides are removed from focus and autoplay interval is clamped', () => {
  assert.match(carouselJs, /slide\.toggleAttribute\('inert', inactive\)/);
  assert.match(carouselJs, /Math\.min\(12000, Math\.max\(2000,/);
  assert.match(carouselJs, /viewport\.setAttribute\('role', 'region'\)/);
});
