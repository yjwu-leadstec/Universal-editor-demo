import {
  addBlockAnchor,
  appendPicture,
  createSectionHeader,
  initProductBlock,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  propPicture,
  propText,
} from '../../scripts/product-block-utils.js';

function pictureAspectRatio(picture) {
  const image = picture?.querySelector('img');
  const width = Number(image?.getAttribute('width'));
  const height = Number(image?.getAttribute('height'));
  return width > 0 && height > 0 ? width / height : 0;
}

function isSwatchPicture(picture) {
  const image = picture?.querySelector('img');
  return Boolean(picture)
    && (/swatch/i.test(image?.alt || '')
      || picture.closest('[data-aue-prop="swatch"]'));
}

function resolveItemPictures(item) {
  const pictures = [...item.querySelectorAll('picture')];
  const authoredSwatch = propPicture(item, 'swatch');
  const swatch = isSwatchPicture(authoredSwatch)
    ? authoredSwatch
    : pictures.find(isSwatchPicture);
  const vehiclePictures = pictures.filter((picture) => picture !== swatch);
  const authoredDesktop = propPicture(item, 'image');
  const authoredMobile = propPicture(item, 'mobileImage');
  const desktop = authoredDesktop && !isSwatchPicture(authoredDesktop)
    && pictureAspectRatio(authoredDesktop) >= 1
    ? authoredDesktop
    : vehiclePictures.find((picture) => pictureAspectRatio(picture) >= 1)
      || vehiclePictures[0];
  const mobile = authoredMobile && authoredMobile !== desktop
    && !isSwatchPicture(authoredMobile)
    && pictureAspectRatio(authoredMobile) < 1
    ? authoredMobile
    : vehiclePictures.find((picture) => (
      picture !== desktop && pictureAspectRatio(picture) < 1
    )) || desktop;

  return {
    swatch: swatch || authoredSwatch,
    desktop,
    mobile,
  };
}

function colorName(item, pictures, index) {
  const swatchAlt = pictures.swatch?.querySelector('img')?.alt || '';
  const imageAlt = pictures.desktop?.querySelector('img')?.alt || '';
  return propText(item, 'name')
    || swatchAlt.replace(/\s+color swatch$/i, '')
    || imageAlt.replace(/\s+Li\s+[A-Z0-9-]+$/i, '')
    || `Color ${index + 1}`;
}

function createPanel(item, pictures, name) {
  const panel = document.createElement('figure');
  panel.className = 'lixiang-product-color-full-screen-slider-panel';

  const desktop = document.createElement('div');
  desktop.className = 'lixiang-product-color-full-screen-slider-picture desktop';
  appendPicture(desktop, pictures.desktop, {
    alt: propText(item, 'imageAlt') || pictures.desktop?.querySelector('img')?.alt,
    fallbackLabel: '',
  });
  instrumentProp(item, 'image', desktop);
  panel.append(desktop);

  if (pictures.mobile) {
    const mobile = document.createElement('div');
    mobile.className = 'lixiang-product-color-full-screen-slider-picture mobile';
    appendPicture(mobile, pictures.mobile, {
      alt: propText(item, 'mobileImageAlt')
        || pictures.mobile.querySelector('img')?.alt
        || propText(item, 'imageAlt'),
      fallbackLabel: '',
    });
    instrumentProp(item, 'mobileImage', mobile);
    panel.append(mobile);
  }

  const caption = document.createElement('figcaption');
  caption.textContent = name;
  instrumentProp(item, 'name', caption);
  panel.append(caption);
  moveItemInstrumentation(item, panel);
  return panel;
}

function createColorButton(item, pictures, name) {
  const button = document.createElement('button');
  button.className = 'lixiang-product-color-full-screen-slider-control';
  button.type = 'button';
  button.setAttribute('aria-label', name);

  const swatch = document.createElement('span');
  swatch.className = 'lixiang-product-color-full-screen-slider-swatch';
  swatch.setAttribute('aria-hidden', 'true');
  if (pictures.swatch) {
    appendPicture(swatch, pictures.swatch, { alt: '', fallbackLabel: '' });
    const swatchImage = swatch.querySelector('img');
    if (swatchImage) swatchImage.alt = '';
    instrumentProp(item, 'swatch', swatch);
  } else {
    swatch.style.backgroundColor = propText(item, 'colorValue') || '#ccc';
    instrumentProp(item, 'colorValue', swatch);
  }
  button.append(swatch);
  return button;
}

function setupColorSlider(block, buttons, panels) {
  if (!buttons.length || buttons.length !== panels.length) return;
  const eventController = new AbortController();
  const { signal } = eventController;
  const instance = `lixiang-color-slider-${Date.now()}`;
  let active = 0;

  const activate = (index, focus = false) => {
    active = (index + buttons.length) % buttons.length;
    buttons.forEach((button, itemIndex) => {
      const selected = itemIndex === active;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      panels[itemIndex].dataset.active = String(selected);
      panels[itemIndex].setAttribute('aria-hidden', String(!selected));
    });
    if (focus) buttons[active].focus();
  };

  buttons.forEach((button, index) => {
    const panel = panels[index];
    const tabId = `${instance}-tab-${index + 1}`;
    const panelId = `${instance}-panel-${index + 1}`;
    button.id = tabId;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panelId);
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    button.addEventListener('click', () => activate(index), { signal });
    button.addEventListener('keydown', (event) => {
      const destinations = {
        ArrowRight: index + 1,
        ArrowDown: index + 1,
        ArrowLeft: index - 1,
        ArrowUp: index - 1,
        Home: 0,
        End: buttons.length - 1,
      };
      if (!Object.prototype.hasOwnProperty.call(destinations, event.key)) return;
      event.preventDefault();
      activate(destinations[event.key], true);
    }, { signal });
  });

  block.addEventListener('aem:block-unload', () => eventController.abort(), {
    once: true,
    signal,
  });
  activate(0);
}

export default function decorate(block) {
  initProductBlock(block);
  const items = modelItems(block, 'lixiang-product-color-full-screen-slider-item');
  const shell = document.createElement('div');
  shell.className = 'lixiang-product-color-full-screen-slider-shell';
  const stage = document.createElement('div');
  stage.className = 'lixiang-product-color-full-screen-slider-stage';
  const header = createSectionHeader(block);
  const controls = document.createElement('div');
  controls.className = 'lixiang-product-color-full-screen-slider-controls';
  controls.setAttribute('role', 'tablist');
  controls.setAttribute('aria-label', 'Vehicle colors');
  const panels = [];
  const buttons = [];

  items.forEach((item, index) => {
    const pictures = resolveItemPictures(item);
    const name = colorName(item, pictures, index);
    const panel = createPanel(item, pictures, name);
    const button = createColorButton(item, pictures, name);
    panels.push(panel);
    buttons.push(button);
    stage.append(panel);
    controls.append(button);
  });

  shell.append(stage, header, controls);
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  setupColorSlider(block, buttons, panels);
}
