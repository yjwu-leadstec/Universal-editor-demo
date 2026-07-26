import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const [fullScreenIntroCss, fullScreenIntroJs, productBlockCss] = await Promise.all([
  readFile(new URL('../blocks/lixiang-product-full-screen-intro/lixiang-product-full-screen-intro.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/lixiang-product-full-screen-intro/lixiang-product-full-screen-intro.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles/product-blocks.css', import.meta.url), 'utf8'),
]);

test('product full-screen intro uses one canonical namespace', async () => {
  assert.doesNotMatch(fullScreenIntroCss, /(^|[^a-z-])chapter-intro([^a-z-]|$)/);
  assert.doesNotMatch(fullScreenIntroJs, /(^|[^a-z-])chapter-intro([^a-z-]|$)/);
  await assert.rejects(
    access(new URL('../blocks/chapter-intro', import.meta.url)),
    /ENOENT/,
  );
});

test('product full-screen intro uses the official 16:9 desktop video geometry', () => {
  assert.match(fullScreenIntroCss, /main \.lixiang-product-full-screen-intro\s*\{[^}]*min-height:\s*0;[^}]*aspect-ratio:\s*16 \/ 9/);
  assert.match(fullScreenIntroCss, /main \.section\.lixiang-product-full-screen-intro-container > \.lixiang-product-full-screen-intro-wrapper\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none;[^}]*padding:\s*0/);
  assert.doesNotMatch(fullScreenIntroCss, /min-height:\s*min\(1080px, max\(720px, 100svh\)\)/);
  assert.match(fullScreenIntroCss, /\.lixiang-product-full-screen-intro-shell,[\s\S]*\.product-media\s*\{[^}]*height:\s*100%/);
  assert.doesNotMatch(fullScreenIntroCss, /\.lixiang-product-full-screen-intro-shell::after/);
  assert.match(fullScreenIntroJs, /createMedia\(block/);
});

test('product full-screen intro matches the official split Licium copy geometry', () => {
  assert.match(fullScreenIntroCss, /\.lixiang-product-full-screen-intro-eyebrow\s*\{[\s\S]*font-family:\s*licium-regular[\s\S]*font-weight:\s*400/);
  assert.match(fullScreenIntroCss, /\.lixiang-product-full-screen-intro-title\s*\{[\s\S]*font-family:\s*licium-medium[\s\S]*font-size:\s*46px[\s\S]*line-height:\s*62px/);
  assert.match(fullScreenIntroCss, /@media \(width >= 720px\) and \(width <= 1024px\)[\s\S]*bottom:\s*11\.9048vw[\s\S]*width:\s*44\.6429vw/);
  assert.match(fullScreenIntroCss, /@media \(width >= 1025px\) and \(width <= 1440px\)[\s\S]*bottom:\s*120px[\s\S]*width:\s*450px/);
  assert.match(fullScreenIntroJs, /const LEGACY_CHAPTER_PREFIXES = \[[\s\S]*'Spatial Arrangement'[\s\S]*'AI Intelligence'[\s\S]*'Advanced Assisted Driving'[\s\S]*'Extended Range, 4WD\.'[\s\S]*'Ultimate Safety'/);
  assert.match(fullScreenIntroJs, /\(\{ eyebrow, title \} = splitLegacyChapterTitle\(eyebrow, title\)\)/);
});

test('product full-screen intro keeps the official full-height mobile composition', () => {
  assert.match(fullScreenIntroCss, /@media \(width <= 719px\)[\s\S]*main > \.section\.lixiang-product-full-screen-intro-container > \.lixiang-product-full-screen-intro-wrapper > \.lixiang-product-full-screen-intro\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100svh;[\s\S]*max-height:\s*844px;[\s\S]*aspect-ratio:\s*auto;[\s\S]*margin-inline-start:\s*0/);
  assert.match(fullScreenIntroCss, /\.lixiang-product-full-screen-intro-copy\s*\{[\s\S]*box-sizing:\s*border-box/);
  assert.match(fullScreenIntroCss, /@media \(width <= 719px\)[\s\S]*bottom:\s*160px;[\s\S]*padding-inline:\s*40px/);
});

test('product full-screen intro keeps the Universal Editor canvas bounded', () => {
  const authorRule = fullScreenIntroCss.lastIndexOf(
    '.adobe-ue-edit main .lixiang-product-full-screen-intro',
  );
  const lastResponsiveRule = fullScreenIntroCss.lastIndexOf('@media');

  assert.ok(authorRule > lastResponsiveRule);
  assert.match(
    fullScreenIntroCss.slice(authorRule),
    /height:\s*auto;[\s\S]*min-height:\s*0;[\s\S]*max-height:\s*1080px;[\s\S]*aspect-ratio:\s*16 \/ 9/,
  );
});

test('shared desktop video control matches the 52px Pencil component', () => {
  assert.match(productBlockCss, /\.product-video-control\s*\{[\s\S]*width:\s*52px;[\s\S]*height:\s*52px/);
});
