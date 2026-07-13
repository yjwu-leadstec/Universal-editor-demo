import {
  addBlockAnchor,
  createMedia,
  createRichText,
  createSectionHeader,
  initProductBlock,
  modelItems,
  moveItemInstrumentation,
  propSource,
  propText,
  revealElements,
  setupTabs,
} from '../../scripts/product-block-utils.js';

function createGroup(group) {
  const panel = document.createElement('section');
  panel.className = 'spec-group';
  if (propSource(group, 'image')) panel.append(createMedia(group, { autoplay: false, showControls: false }).element);
  const descriptionSource = propSource(group, 'description');
  if (descriptionSource?.textContent.trim()) panel.append(createRichText(descriptionSource, 'spec-group-description'));
  const rows = document.createElement('dl');
  rows.className = 'spec-rows';
  modelItems(group, 'spec-row').forEach((item) => {
    const row = document.createElement('div');
    row.className = 'spec-row';
    const iconSource = propSource(item, 'icon');
    if (iconSource) row.append(createMedia(item, { autoplay: false, showControls: false }).element);
    const term = document.createElement('dt');
    term.textContent = propText(item, 'label');
    const detail = document.createElement('dd');
    detail.textContent = propText(item, 'value');
    row.append(term, detail);
    const rowDescription = propSource(item, 'description');
    if (rowDescription?.textContent.trim()) row.append(createRichText(rowDescription, 'spec-row-description'));
    moveItemInstrumentation(item, row);
    rows.append(row);
  });
  panel.append(rows);
  const note = propText(group, 'note');
  if (note) {
    const element = document.createElement('p');
    element.className = 'spec-group-note';
    element.textContent = note;
    panel.append(element);
  }
  moveItemInstrumentation(group, panel);
  return panel;
}

export default function decorate(block) {
  initProductBlock(block);
  const variant = propText(block, 'variant') || 'sections';
  block.classList.add(`variant-${variant}`);
  const groups = modelItems(block, 'spec-group');
  const shell = document.createElement('div');
  shell.className = 'spec-table-shell';
  const header = createSectionHeader(block);
  if (header.childElementCount) shell.append(header);
  const panels = groups.map(createGroup);
  if (variant === 'tabbed' && panels.length) {
    const tabs = document.createElement('div');
    tabs.className = 'spec-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Specification groups');
    const buttons = groups.map((group, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = propText(group, 'title') || `Group ${index + 1}`;
      tabs.append(button);
      return button;
    });
    const panelList = document.createElement('div');
    panelList.className = 'spec-panels';
    panelList.append(...panels);
    shell.append(tabs, panelList);
    setupTabs(block, buttons, panels);
  } else {
    const list = document.createElement('div');
    list.className = 'spec-panels';
    panels.forEach((panel, index) => {
      const title = document.createElement('h3');
      title.className = 'spec-group-title';
      title.textContent = propText(groups[index], 'title');
      panel.prepend(title);
    });
    list.append(...panels);
    shell.append(list);
  }
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.product-section-header, .spec-group');
}
