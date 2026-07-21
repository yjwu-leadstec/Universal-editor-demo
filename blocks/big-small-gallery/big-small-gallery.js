import {
  addBlockAnchor,
  createMedia,
  createProductLink,
  createRichText,
  createSectionHeader,
  initProductBlock,
  instrumentProp,
  modelItems,
  moveItemInstrumentation,
  propBoolean,
  propSource,
  propText,
  propUrl,
  revealElements,
} from '../../scripts/product-block-utils.js';

function createStat(item) {
  const stat = document.createElement('div');
  stat.className = 'big-small-stat';
  const eyebrow = propText(item, 'eyebrow');
  if (eyebrow) {
    const label = document.createElement('p');
    label.className = 'big-small-stat-eyebrow';
    label.textContent = eyebrow;
    instrumentProp(item, 'eyebrow', label);
    stat.append(label);
  }
  const value = propText(item, 'value');
  const unit = propText(item, 'unit');
  if (value || unit) {
    const metric = document.createElement('p');
    metric.className = 'big-small-stat-value';
    const strong = document.createElement('strong');
    strong.textContent = value;
    const suffix = document.createElement('span');
    suffix.textContent = unit;
    metric.append(strong, suffix);
    stat.append(metric);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'big-small-stat-description');
    instrumentProp(item, 'description', description);
    stat.append(description);
  }
  moveItemInstrumentation(item, stat);
  return stat;
}

function createCard(block, item) {
  const card = document.createElement('article');
  card.className = 'big-small-card';
  const { element: media } = createMedia(item, {
    autoplay: true,
    showControls: propBoolean(block, 'showVideoControl', true),
    showProgress: propBoolean(block, 'showProgress', true),
  });
  const copy = document.createElement('div');
  copy.className = 'big-small-card-copy';
  const title = propText(item, 'title');
  if (title) {
    const heading = document.createElement('h3');
    heading.textContent = title;
    instrumentProp(item, 'title', heading);
    copy.append(heading);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'big-small-card-description');
    instrumentProp(item, 'description', description);
    copy.append(description);
  }
  const link = createProductLink(item);
  if (link) copy.append(link);
  card.append(media);
  if (copy.childElementCount) card.append(copy);
  moveItemInstrumentation(item, card);
  return card;
}

export default function decorate(block) {
  initProductBlock(block);
  const shell = document.createElement('div');
  shell.className = 'big-small-gallery-shell';
  const header = createSectionHeader(block);
  const videoLink = propUrl(block, 'videoLink');
  if (videoLink) {
    const link = document.createElement('a');
    link.className = 'big-small-video-link';
    link.href = videoLink;
    link.textContent = propText(block, 'videoLinkText') || 'Watch video';
    instrumentProp(block, 'videoLink', link);
    header.append(link);
  }
  if (header.childElementCount) shell.append(header);

  const stats = modelItems(block, 'big-small-stat');
  if (stats.length) {
    const list = document.createElement('div');
    list.className = 'big-small-stats';
    stats.forEach((item) => list.append(createStat(item)));
    shell.append(list);
  }
  const items = modelItems(block, 'big-small-item');
  if (items.length) {
    const gallery = document.createElement('div');
    gallery.className = 'big-small-list';
    items.slice(0, 3).forEach((item) => gallery.append(createCard(block, item)));
    shell.append(gallery);
  }
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  revealElements(block, '.product-section-header, .big-small-stat, .big-small-card', propBoolean(block, 'enableMotion', true));
}
