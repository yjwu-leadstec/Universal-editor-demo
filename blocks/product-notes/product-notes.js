import {
  addBlockAnchor,
  createRichText,
  initProductBlock,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  propSource,
  propText,
} from '../../scripts/product-block-utils.js';

export default function decorate(block) {
  initProductBlock(block);
  const shell = document.createElement('div');
  shell.className = 'product-notes-shell';
  const title = propText(block, 'title');
  if (title) {
    const heading = document.createElement('h2');
    heading.textContent = title;
    instrumentProp(block, 'title', heading);
    shell.append(heading);
  }
  const list = document.createElement('ol');
  modelItems(block, 'product-note-item').forEach((item) => {
    const note = document.createElement('li');
    const source = propSource(item, 'text');
    note.append(createRichText(source, 'product-note-text'));
    moveItemInstrumentation(item, note);
    list.append(note);
  });
  if (list.childElementCount) shell.append(list);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
}
