import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [gridCss, gridJs] = await Promise.all([
  readFile(new URL('../blocks/home-vehicle-grid/home-vehicle-grid.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/home-vehicle-grid/home-vehicle-grid.js', import.meta.url), 'utf8'),
]);

test('desktop vehicle grid places the featured card first across two columns', () => {
  assert.match(
    gridCss,
    /\.home-vehicle-grid \.vehicle-tile\.large\s*\{[^}]*order:\s*-1;[^}]*grid-column:\s*span\s*2;/,
  );
});

test('medium vehicle grid uses a full-width feature followed by two-column 16:9 cards', () => {
  assert.match(gridCss, /@media \(width <= 1024px\)/);
  assert.match(
    gridCss,
    /@media \(width <= 1024px\)[\s\S]*?\.home-vehicle-grid \.vehicle-grid\s*\{[^}]*display:\s*flex;[^}]*height:\s*auto;[^}]*flex-wrap:\s*wrap;/,
  );
  assert.match(
    gridCss,
    /@media \(width <= 1024px\)[\s\S]*?\.home-vehicle-grid \.vehicle-tile\s*\{[^}]*width:\s*50%;[^}]*aspect-ratio:\s*16\s*\/\s*9;/,
  );
  assert.match(
    gridCss,
    /@media \(width <= 1024px\)[\s\S]*?\.home-vehicle-grid \.vehicle-tile\.large\s*\{[^}]*order:\s*-1;[^}]*width:\s*100%;/,
  );
});

test('mobile vehicle grid stacks 16:9 cards with the official four pixel rhythm', () => {
  assert.match(gridCss, /@media \(width <= 720px\)/);
  assert.match(
    gridCss,
    /@media \(width <= 720px\)[\s\S]*?\.home-vehicle-grid \.vehicle-grid\s*\{[^}]*display:\s*block;[^}]*overflow:\s*hidden;/,
  );
  assert.match(
    gridCss,
    /@media \(width <= 720px\)[\s\S]*?\.home-vehicle-grid \.vehicle-tile\s*\{[^}]*width:\s*100%;[^}]*margin-bottom:\s*4px;/,
  );
});

test('combined logo artwork does not duplicate the authored subtitle', () => {
  assert.match(gridJs, /!tile\.logoPicture\s*&&\s*tile\.subtitle/);
  assert.doesNotMatch(gridCss, /\.vehicle-subtitle\s*\{[^}]*margin-top:\s*auto;/s);
});

test('medium cards suppress desktop-only hover actions', () => {
  assert.match(
    gridCss,
    /@media \(width <= 1024px\)[\s\S]*?\.home-vehicle-grid \.vehicle-actions\s*\{[^}]*display:\s*none;/,
  );
});
