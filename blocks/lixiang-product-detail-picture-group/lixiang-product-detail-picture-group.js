import {
  addBlockAnchor,
  createMedia,
  createRichText,
  createSectionHeader,
  initProductBlock,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  prefersReducedMotion,
  propBoolean,
  propSource,
  propText,
  revealElements,
  setupTabs,
} from '../../scripts/product-block-utils.js';

function setupParallax(block) {
  block.productDetailPictureGroupMotion?.abort();
  if (prefersReducedMotion()) return;
  const media = [...block.querySelectorAll('.lixiang-product-detail-picture-group-media')];
  if (!media.length) return;

  const controller = new AbortController();
  block.productDetailPictureGroupMotion = controller;
  let frame = null;
  const update = () => {
    frame = null;
    media.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const range = window.innerHeight + rect.height;
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / range));
      item.style.setProperty('--product-detail-picture-parallax', `${(progress - 0.5) * 12}%`);
    });
  };
  const requestUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };

  window.addEventListener('scroll', requestUpdate, { passive: true, signal: controller.signal });
  window.addEventListener('resize', requestUpdate, { signal: controller.signal });
  controller.signal.addEventListener('abort', () => {
    if (frame) window.cancelAnimationFrame(frame);
  }, { once: true });
  update();
}

function createPanel(block, group) {
  const panel = document.createElement('section');
  panel.className = 'lixiang-product-detail-picture-group-panel';
  const descriptionSource = propSource(group, 'description');
  if (descriptionSource?.textContent.trim()) {
    panel.append(createRichText(
      descriptionSource,
      'lixiang-product-detail-picture-group-description',
    ));
  }

  const grid = document.createElement('div');
  grid.className = 'lixiang-product-detail-picture-group-grid';
  modelItems(group, 'lixiang-product-detail-picture-item').forEach((item) => {
    const figure = document.createElement('figure');
    figure.className = 'lixiang-product-detail-picture-group-media';
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
      if (description?.textContent.trim()) {
        caption.append(createRichText(
          description,
          'lixiang-product-detail-picture-description',
        ));
      }
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
  const groups = modelItems(block, 'lixiang-product-detail-picture-group-item');
  const shell = document.createElement('div');
  shell.className = 'lixiang-product-detail-picture-group-shell';
  const header = createSectionHeader(block);
  if (header.childElementCount) shell.append(header);

  const tabs = document.createElement('div');
  tabs.className = 'lixiang-product-detail-picture-group-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Product detail picture sets');
  const buttons = groups.map((group, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = propText(group, 'title') || `Picture set ${index + 1}`;
    tabs.append(button);
    return button;
  });

  const panels = groups.map((group) => createPanel(block, group));
  const panelList = document.createElement('div');
  panelList.className = 'lixiang-product-detail-picture-group-panels';
  panelList.append(...panels);
  if (buttons.length > 1) shell.append(tabs);
  shell.append(panelList);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);

  if (buttons.length > 1) setupTabs(block, buttons, panels);
  const enableMotion = propBoolean(block, 'enableMotion', true);
  revealElements(
    block,
    '.product-section-header, .lixiang-product-detail-picture-group-media',
    enableMotion,
  );
  if (enableMotion) setupParallax(block);
  else block.productDetailPictureGroupMotion?.abort();
}
