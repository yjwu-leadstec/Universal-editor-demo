import {
  addBlockAnchor,
  appendPicture,
  createMedia,
  createSectionHeader,
  initProductBlock,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  propPicture,
  propText,
  revealElements,
  setupTabs,
} from '../../scripts/product-block-utils.js';

export default function decorate(block) {
  initProductBlock(block);
  const items = modelItems(block, 'color-switcher-item');
  const names = items.map((item, index) => propText(item, 'name')
    || item.querySelector('picture img')?.alt.replace(/\s+Li L6$/i, '')
    || `Color ${index + 1}`);
  const shell = document.createElement('div');
  shell.className = 'color-switcher-shell';
  const header = createSectionHeader(block);
  const stage = document.createElement('div');
  stage.className = 'color-switcher-stage';
  const panels = [];
  items.forEach((item, index) => {
    const panel = document.createElement('figure');
    panel.className = 'color-switcher-panel';
    const { element: media } = createMedia(item, { autoplay: false, showControls: false });
    const caption = document.createElement('figcaption');
    caption.textContent = names[index];
    instrumentProp(item, 'name', caption);
    panel.append(media, caption);
    moveItemInstrumentation(item, panel);
    panels.push(panel);
    stage.append(panel);
  });
  const controls = document.createElement('div');
  controls.className = 'color-switcher-controls';
  controls.setAttribute('role', 'tablist');
  controls.setAttribute('aria-label', 'Vehicle colors');
  const buttons = items.map((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', names[index] || 'Vehicle color');
    const swatch = document.createElement('span');
    swatch.className = 'color-switcher-swatch';
    const picture = propPicture(item, 'swatch');
    if (picture) {
      appendPicture(swatch, picture, { alt: propText(item, 'swatchAlt'), fallbackLabel: '' });
      instrumentProp(item, 'swatch', swatch);
    } else {
      swatch.style.backgroundColor = propText(item, 'colorValue') || '#ccc';
      instrumentProp(item, 'colorValue', swatch);
    }
    const label = document.createElement('span');
    label.className = 'color-switcher-label';
    label.textContent = names[index];
    button.append(swatch, label);
    controls.append(button);
    return button;
  });
  shell.append(header, stage, controls);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  setupTabs(block, buttons, panels);
  revealElements(block, '.product-section-header, .color-switcher-stage, .color-switcher-controls');
}
