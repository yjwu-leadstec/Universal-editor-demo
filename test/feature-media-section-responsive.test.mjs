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
  assert.match(featureJs, /button\.className = 'feature-media-tab'/);
});

test('desktop tab underline spans the tab and sits outside its bottom edge', () => {
  assert.match(featureCss, /\.feature-media-tabs \.feature-media-tab\s*\{[\s\S]*appearance:\s*none[\s\S]*border-radius:\s*0[\s\S]*overflow:\s*visible[\s\S]*text-overflow:\s*clip/);
  assert.match(featureCss, /\.variant-default\.is-tabbed \.feature-media-tabs::after\s*\{[\s\S]*inset:\s*auto 0 0[\s\S]*height:\s*2px[\s\S]*background:\s*rgb\(0 0 0 \/ 10%\)/);
  assert.match(featureCss, /\.variant-default\.is-tabbed \.feature-media-tabs \.feature-media-tab\s*\{[\s\S]*min-height:\s*clamp\(30px, 2\.0833vw, 40px\)[\s\S]*padding:\s*0/);
  assert.match(featureCss, /\.variant-default\.is-tabbed \.feature-media-tabs \.feature-media-tab::after\s*\{[\s\S]*inset:\s*auto 0 -2px[\s\S]*width:\s*100%[\s\S]*background:\s*transparent/);
  assert.match(featureCss, /\.variant-default\.is-tabbed \.feature-media-tabs \.feature-media-tab::after\s*\{[\s\S]*transition:\s*background-color 200ms ease/);
  assert.match(featureCss, /\.variant-default\.is-tabbed \.feature-media-tabs \.feature-media-tab:focus-visible\s*\{[\s\S]*outline:\s*none/);
  assert.match(featureCss, /\.variant-default\.is-tabbed \.feature-media-tabs \.feature-media-tab:focus-visible::after\s*\{[\s\S]*background:\s*var\(--product-accent\)/);
  assert.match(featureCss, /@media \(width <= 719px\)[\s\S]*\.feature-media-tabs::after\s*\{[\s\S]*display:\s*none/);
});

test('feature media keeps vertical tabs through the medium-small breakpoint', () => {
  assert.match(featureCss, /@media \(width <= 820px\)[\s\S]*\.feature-media-tab-copies\s*\{[\s\S]*order:\s*2/);
  assert.match(featureCss, /@media \(width <= 820px\)[\s\S]*\.feature-media-tabs\s*\{[\s\S]*display:\s*grid[\s\S]*grid-template-columns:\s*1fr[\s\S]*order:\s*3[\s\S]*gap:\s*16px/);
  assert.match(featureCss, /@media \(width <= 820px\)[\s\S]*\.feature-media-tabs \.feature-media-tab\s*\{[\s\S]*width:\s*100%[\s\S]*min-height:\s*22px[\s\S]*font-size:\s*14px[\s\S]*line-height:\s*22px/);
  assert.match(featureCss, /@media \(width >= 821px\) and \(width <= 1024px\)[\s\S]*gap:\s*2\.9762vw/);
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

test('mobile feature media keeps the manual swipe rail and official vertical tab geometry', () => {
  assert.match(featureCss, /@media \(width <= 820px\)[\s\S]*overflow-x:\s*auto[\s\S]*scroll-snap-type:\s*x mandatory/);
  assert.match(featureCss, /@media \(width <= 820px\)[\s\S]*\.feature-media-panels > \.feature-media-item\[hidden\][\s\S]*display:\s*block[\s\S]*flex:\s*0 0 100%/);
  assert.match(featureCss, /@media \(width <= 820px\)[\s\S]*\.variant-default\.is-tabbed \.feature-media-tabs\s*\{[\s\S]*border-left:\s*1px solid rgb\(217 217 217 \/ 20%\)[\s\S]*gap:\s*16px/);
  assert.match(featureCss, /@media \(width <= 820px\)[\s\S]*\.feature-media-tabs \.feature-media-tab\s*\{[\s\S]*width:\s*100%[\s\S]*min-height:\s*22px[\s\S]*margin:\s*0[\s\S]*padding:\s*0 0 0 16px[\s\S]*color:\s*#999/);
  assert.match(featureCss, /@media \(width <= 820px\)[\s\S]*\.feature-media-tabs \.feature-media-tab::after\s*\{[\s\S]*inset:\s*0 auto 0 -1px[\s\S]*background:\s*transparent/);
  assert.match(featureCss, /@media \(width <= 820px\)[\s\S]*\.feature-media-tab\[aria-selected="true"\]\s*\{[\s\S]*color:\s*#191919/);
  assert.match(featureCss, /@media \(width <= 820px\)[\s\S]*\.feature-media-tab\[aria-selected="true"\]::after\s*\{[\s\S]*z-index:\s*2[\s\S]*width:\s*2px[\s\S]*background:\s*var\(--product-accent\)[\s\S]*opacity:\s*1/);
  assert.match(featureJs, /matchMedia\('\(width <= 820px\)'\)/);
  assert.match(featureJs, /if \(!autoPlay \|\| mobileQuery\.matches/);
  assert.match(featureJs, /viewport\.addEventListener\('scroll'/);
});
