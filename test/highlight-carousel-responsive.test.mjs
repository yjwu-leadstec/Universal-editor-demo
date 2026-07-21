import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [carouselCss, carouselJs] = await Promise.all([
  readFile(new URL('../blocks/highlight-carousel/highlight-carousel.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/highlight-carousel/highlight-carousel.js', import.meta.url), 'utf8'),
]);

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
  assert.match(carouselCss, /padding-block:\s*11\.9048vw/);
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
  assert.match(carouselCss, /@media \(width <= 540px\)/);
  assert.match(carouselCss, /height:\s*calc\(\(100vw - 40px\) \* 0\.5625 \+ 440px\)/);
  assert.match(carouselCss, /min-height:\s*230px/);
  assert.match(carouselCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(carouselCss, /@media \(width <= 720px\)[\s\S]*visibility:\s*visible/);
});
