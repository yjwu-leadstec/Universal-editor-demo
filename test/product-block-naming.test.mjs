import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const sectionModelUrl = new URL('../models/_section.json', import.meta.url);
const blocksUrl = new URL('../blocks/', import.meta.url);

test('product-page blocks use the lixiang-product namespace', async () => {
  const sectionModel = JSON.parse(await readFile(sectionModelUrl, 'utf8'));
  const sectionFilter = sectionModel.filters.find(({ id }) => id === 'section');
  const blockDirectories = await readdir(blocksUrl);

  assert.deepEqual(
    sectionFilter.components.filter((id) => id.startsWith('product-')),
    [],
  );
  assert.deepEqual(
    blockDirectories.filter((name) => name.startsWith('product-')),
    [],
  );
});
