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

test('mobile carousel disables autoplay and equalizes card copy height', () => {
  assert.match(carouselJs, /matchMedia\('\(width <= 720px\)'\)/);
  assert.match(carouselCss, /@media \(width <= 540px\)/);
  assert.match(carouselCss, /height:\s*calc\(\(100vw - 40px\) \* 0\.5625 \+ 440px\)/);
  assert.match(carouselCss, /min-height:\s*230px/);
  assert.match(carouselCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
});
