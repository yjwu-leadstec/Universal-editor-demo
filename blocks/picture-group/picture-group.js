import {
  addBlockAnchor,
  createMedia,
  createRichText,
  createSectionHeader,
  initProductBlock,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  propBoolean,
  propSource,
  propText,
  revealElements,
  setupTabs,
} from '../../scripts/product-block-utils.js';

function createPanel(block, group) {
  const panel = document.createElement('section');
  panel.className = 'picture-group-panel';
  const descriptionSource = propSource(group, 'description');
  if (descriptionSource?.textContent.trim()) panel.append(createRichText(descriptionSource, 'picture-group-description'));
  const grid = document.createElement('div');
  grid.className = 'picture-group-grid';
  modelItems(group, 'picture-media-item').forEach((item) => {
    const figure = document.createElement('figure');
    figure.className = 'picture-group-media';
    const { element: media } = createMedia(item, {
      showControls: propBoolean(block, 'showVideoControl', true),
      showProgress: propBoolean(block, 'showProgress', true),
    });
    figure.append(media);
    const title = propText(item, 'title');
    const description = propSource(item, 'description');
    if (title || description?.textContent.trim()) {
      const caption = document.createElement('figcaption');
      if (title) {
        const heading = document.createElement('h3');
        heading.textContent = title;
        instrumentProp(item, 'title', heading);
        caption.append(heading);
      }
      if (description?.textContent.trim()) caption.append(createRichText(description, 'picture-media-description'));
      figure.append(caption);
    }
    moveItemInstrumentation(item, figure);
    grid.append(figure);
  });
  panel.append(grid);
  moveItemInstrumentation(group, panel);
  return panel;
}

export default function decorate(block) {
  initProductBlock(block);
  const groups = modelItems(block, 'picture-group-item');
  const shell = document.createElement('div');
  shell.className = 'picture-group-shell';
  const header = createSectionHeader(block);
  if (header.childElementCount) shell.append(header);
  const tabs = document.createElement('div');
  tabs.className = 'picture-group-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Picture groups');
  const buttons = groups.map((group, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = propText(group, 'title') || `Group ${index + 1}`;
    tabs.append(button);
    return button;
  });
  const panels = groups.map((group) => createPanel(block, group));
  const panelList = document.createElement('div');
  panelList.className = 'picture-group-panels';
  panelList.append(...panels);
  if (buttons.length > 1) shell.append(tabs);
  shell.append(panelList);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  if (buttons.length > 1) setupTabs(block, buttons, panels);
  revealElements(block, '.product-section-header, .picture-group-media', propBoolean(block, 'enableMotion', true));
}
