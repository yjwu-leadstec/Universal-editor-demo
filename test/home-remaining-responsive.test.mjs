import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [carouselCss, carouselJs, productCss] = await Promise.all([
  readFile(new URL('../blocks/home-carousel/home-carousel.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/home-carousel/home-carousel.js', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/home-product-list/home-product-list.css', import.meta.url), 'utf8'),
]);

test('desktop carousels derive their height from the official responsive card geometry', () => {
  assert.doesNotMatch(carouselCss, /min-height:\s*1216px/);
  assert.match(carouselCss, /--home-card-w:\s*calc\(77\.0833vw \+ 16px\)/);
  assert.match(carouselCss, /--home-card-h:\s*43\.3594vw/);
  assert.match(carouselCss, /--home-card-step:\s*var\(--home-card-w\)/);
  assert.match(carouselCss, /padding:\s*clamp\(120px, 8\.3333vw, 160px\)/);
  assert.match(carouselCss, /font-family:\s*licium-regular/);
  assert.match(carouselCss, /width:\s*clamp\(36px, 2\.5vw, 48px\)/);
  assert.match(carouselCss, /width:\s*clamp\(18px, 1\.25vw, 24px\)/);
});

test('story and product CTAs retain the official directional affordances', () => {
  assert.match(carouselCss, /\.home-carousel\.story \.home-horizontal-copy span::after/);
  assert.match(carouselCss, /clip-path:\s*polygon\(12% 0, 100% 50%, 12% 100%\)/);
  assert.match(productCss, /\.home-product-list \.button-link::after/);
  assert.match(productCss, /transform:\s*rotate\(45deg\)/);
});

test('1024px carousels use the official scaled medium-screen rhythm', () => {
  assert.match(carouselCss, /@media \(width <= 1100px\) and \(width > 820px\)/);
  assert.match(
    carouselCss,
    /@media \(width <= 1100px\)[\s\S]*?\.home-carousel\s*\{[^}]*padding:\s*11\.9048vw 0 5\.9524vw;/,
  );
  assert.match(carouselCss, /font-size:\s*3\.4226vw/);
  assert.match(carouselCss, /line-height:\s*4\.6131vw/);
  assert.match(carouselCss, /width:\s*3\.5714vw/);
});

test('mobile story and tech carousels keep their independent official spacing', () => {
  assert.match(
    carouselCss,
    /@media \(width <= 820px\)[\s\S]*?\.home-carousel:not\(\.tech\)\s*\{[^}]*padding-bottom:\s*80px;/,
  );
  assert.match(
    carouselCss,
    /@media \(width <= 820px\)[\s\S]*?\.home-carousel\.tech\s*\{[^}]*padding:\s*80px 0 40px;/,
  );
  assert.match(carouselCss, /--home-card-w:\s*calc\(100vw - 32px\)/);
  assert.match(carouselCss, /height:\s*calc\(var\(--home-card-h\) \+ 22px\)/);
  assert.match(carouselCss, /box-sizing:\s*border-box/);
});

test('optional empty UE cells cannot shift a tech title into the action slot', () => {
  assert.match(carouselJs, /textCells\(row\)\.filter\(Boolean\)/);
});

test('product tiles scale gap, copy inset, and typography across desktop and medium screens', () => {
  assert.match(productCss, /gap:\s*clamp\(12px, 0\.8333vw, 16px\)/);
  assert.match(productCss, /inset:\s*clamp\(60px, 4\.1667vw, 80px\)/);
  assert.match(productCss, /font-size:\s*clamp\(24px, 1\.6667vw, 32px\)/);
  assert.match(productCss, /@media \(width >= 1560px\)/);
  assert.match(productCss, /@media \(width <= 1100px\) and \(width > 820px\)/);
  assert.match(productCss, /font-family:\s*licium-regular/);
  assert.match(productCss, /width:\s*clamp\(82px, 5\.397vw, 103\.62px\)/);
  assert.match(productCss, /font-size:\s*clamp\(12px, 0\.8333vw, 16px\)/);
});
