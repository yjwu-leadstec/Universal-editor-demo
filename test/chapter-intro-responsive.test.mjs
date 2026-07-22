import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [chapterCss, chapterJs, productBlockCss] = await Promise.all([
  readFile(new URL('../blocks/chapter-intro/chapter-intro.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/chapter-intro/chapter-intro.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles/product-blocks.css', import.meta.url), 'utf8'),
]);

test('chapter intro uses the official 16:9 desktop video geometry', () => {
  assert.match(chapterCss, /main \.chapter-intro\s*\{[^}]*min-height:\s*0;[^}]*aspect-ratio:\s*16 \/ 9/);
  assert.match(chapterCss, /main \.section\.chapter-intro-container > \.chapter-intro-wrapper\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*none;[^}]*padding:\s*0/);
  assert.doesNotMatch(chapterCss, /min-height:\s*min\(1080px, max\(720px, 100svh\)\)/);
  assert.match(chapterCss, /\.chapter-intro-shell,[\s\S]*\.product-media\s*\{[^}]*height:\s*100%/);
  assert.match(chapterJs, /createMedia\(block/);
});

test('chapter intro matches the official split Licium copy geometry', () => {
  assert.match(chapterCss, /\.chapter-intro-eyebrow\s*\{[\s\S]*font-family:\s*licium-regular[\s\S]*font-weight:\s*400/);
  assert.match(chapterCss, /\.chapter-intro-title\s*\{[\s\S]*font-family:\s*licium-medium[\s\S]*font-size:\s*46px[\s\S]*line-height:\s*62px/);
  assert.match(chapterCss, /@media \(width >= 720px\) and \(width <= 1024px\)[\s\S]*bottom:\s*11\.9048vw[\s\S]*width:\s*44\.6429vw/);
  assert.match(chapterCss, /@media \(width >= 1025px\) and \(width <= 1440px\)[\s\S]*bottom:\s*120px[\s\S]*width:\s*450px/);
  assert.match(chapterJs, /propText\(block, 'id'\) === 'design' && title\.startsWith\(legacyExteriorPrefix\)/);
});

test('chapter intro keeps the official full-height mobile composition', () => {
  assert.match(chapterCss, /@media \(width <= 719px\)[\s\S]*main > \.section\.chapter-intro-container > \.chapter-intro-wrapper > \.chapter-intro\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100svh;[\s\S]*max-height:\s*844px;[\s\S]*aspect-ratio:\s*auto;[\s\S]*margin-inline-start:\s*0/);
  assert.match(chapterCss, /\.chapter-intro-copy\s*\{[\s\S]*box-sizing:\s*border-box/);
  assert.match(chapterCss, /@media \(width <= 719px\)[\s\S]*bottom:\s*160px;[\s\S]*padding-inline:\s*40px/);
});

test('shared desktop video control matches the 52px Pencil component', () => {
  assert.match(productBlockCss, /\.product-video-control\s*\{[\s\S]*width:\s*52px;[\s\S]*height:\s*52px/);
});
