import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [settingsCss, settingsJs] = await Promise.all([
  readFile(new URL('../blocks/header-settings/header-settings.css', import.meta.url), 'utf8'),
  readFile(new URL('../blocks/header-settings/header-settings.js', import.meta.url), 'utf8'),
]);

test('header settings expose one selectable card only in Universal Editor', () => {
  assert.match(settingsCss, /\.header-settings\s*\{[^}]*display:\s*none;/s);
  assert.match(
    settingsCss,
    /\.header-settings\[data-aue-resource\]\s*\{[^}]*display:\s*block;[^}]*min-height:\s*96px;/s,
  );
  assert.match(
    settingsCss,
    /\.header-settings\[data-aue-resource\]\s*>\s*:not\(\.header-settings-authoring-card\)\s*\{[^}]*display:\s*none;/s,
  );
  assert.match(settingsJs, /block\.prepend\(buildAuthoringCard\(block\)\)/);
});

test('header settings authoring card is idempotent and keeps parser data intact', () => {
  assert.match(
    settingsJs,
    /querySelector\(':scope > \.header-settings-authoring-card'\)\?\.remove\(\)/,
  );
  assert.match(settingsJs, /block\.dataset\.headerSettings = 'true'/);
  assert.match(settingsJs, /block\.dataset\[field\] = labels\[index\]/);
});
