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
  assert.doesNotMatch(chapterCss, /min-height:\s*min\(1080px, max\(720px, 100svh\)\)/);
  assert.match(chapterCss, /\.chapter-intro-shell,[\s\S]*\.product-media\s*\{[^}]*height:\s*100%/);
  assert.match(chapterJs, /createMedia\(block/);
});

test('chapter intro keeps the official full-height mobile composition', () => {
  assert.match(chapterCss, /@media \(width <= 719px\)[\s\S]*height:\s*100svh;[\s\S]*max-height:\s*844px;[\s\S]*aspect-ratio:\s*auto/);
});

test('shared desktop video control matches the 52px Pencil component', () => {
  assert.match(productBlockCss, /\.product-video-control\s*\{[\s\S]*width:\s*52px;[\s\S]*height:\s*52px/);
});
