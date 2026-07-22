import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [featureCss, featureJs] = await Promise.all([
  readFile(new URL('../blocks/feature-media-section/feature-media-section.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/feature-media-section/feature-media-section.js', import.meta.url), 'utf8'),
]);

test('tabbed feature media uses the official Licium typography and tab geometry', () => {
  assert.match(featureCss, /\.variant-default\.is-tabbed\s*\{[\s\S]*font-family:\s*licium-regular/);
  assert.match(featureCss, /\.variant-default\.is-tabbed \.product-title\s*\{[\s\S]*font-family:\s*licium-medium/);
  assert.match(featureCss, /width:\s*clamp\(98px, 5\.651vw, 108\.5px\)/);
  assert.match(featureCss, /gap:\s*clamp\(30px, 2\.0833vw, 40px\)/);
  assert.match(featureCss, /font-weight:\s*400/);
});

test('tabbed feature media matches the official desktop height rhythm', () => {
  assert.match(featureCss, /@media \(width >= 1025px\) and \(width <= 1440px\)/);
  assert.match(featureCss, /margin-block-end:\s*42px/);
  assert.match(featureCss, /padding-block-start:\s*18px/);
  assert.match(featureCss, /font-size:\s*10\.5px;\s*\n\s*line-height:\s*15\.75px/);
  assert.match(featureCss, /margin-block-end:\s*clamp\(42px, 2\.9167vw, 56px\)/);
});

test('tab copy height follows the longest authored description', () => {
  assert.match(featureCss, /\.feature-media-tab-copies\s*\{[\s\S]*display:\s*grid/);
  assert.match(featureCss, /\.feature-media-tab-copy\s*\{[\s\S]*grid-area:\s*1 \/ 1/);
  assert.match(featureCss, /\.feature-media-tab-copy\.is-active/);
  assert.match(featureJs, /copies\[itemIndex\]\.classList\.toggle\('is-active', selected\)/);
  assert.match(featureJs, /setAttribute\('aria-hidden', String\(!selected\)\)/);
  assert.doesNotMatch(featureJs, /copies\[itemIndex\]\.hidden = !selected/);
});

test('mobile feature media keeps the manual swipe rail and full-width vertical tabs', () => {
  assert.match(featureCss, /@media \(width <= 719px\)[\s\S]*scroll-snap-type:\s*x mandatory/);
  assert.match(featureCss, /@media \(width <= 719px\)[\s\S]*\.feature-media-tabs button\s*\{[\s\S]*width:\s*100%/);
  assert.match(featureJs, /if \(!autoPlay \|\| mobileQuery\.matches/);
  assert.match(featureJs, /viewport\.addEventListener\('scroll'/);
});
