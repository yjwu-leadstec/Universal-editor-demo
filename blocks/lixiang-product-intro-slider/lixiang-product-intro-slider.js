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
  prefersReducedMotion,
  propBoolean,
  propNumber,
  propSource,
  propText,
  revealElements,
} from '../../scripts/product-block-utils.js';

const MOBILE_QUERY = '(width <= 720px)';
const carouselInstances = new WeakMap();

function createStat(item) {
  const stat = document.createElement('div');
  stat.className = 'highlight-stat';
  const label = propText(item, 'label');
  const value = propText(item, 'value');
  const unit = propText(item, 'unit');
  if (label) {
    const term = document.createElement('dt');
    term.textContent = label;
    instrumentProp(item, 'label', term);
    stat.append(term);
  }
  if (value || unit) {
    const detail = document.createElement('dd');
    detail.textContent = [value, unit].filter(Boolean).join(' ');
    instrumentProp(item, 'value', detail);
    stat.append(detail);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'highlight-stat-description');
    instrumentProp(item, 'description', description);
    stat.append(description);
  }
  moveItemInstrumentation(item, stat);
  return stat;
}

function createSlide(block, item, index) {
  const slide = document.createElement('article');
  slide.className = 'highlight-slide';
  const copyColor = propText(item, 'copyColor');
  if (['white', 'black'].includes(copyColor)) slide.classList.add(`highlight-copy-${copyColor}`);
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');
  slide.setAttribute('aria-label', `Slide ${index + 1}`);
  const {
    element: media,
    setActive: setMediaActive,
    destroy: destroyMedia,
  } = createMedia(item, {
    autoplay: true,
    showControls: propBoolean(block, 'showVideoControl', true),
    showProgress: propBoolean(block, 'showProgress', true),
  });
  const copy = document.createElement('div');
  copy.className = 'highlight-slide-copy';
  const eyebrow = propText(item, 'eyebrow');
  const title = propText(item, 'title');
  if (eyebrow) {
    const element = document.createElement('p');
    element.className = 'highlight-eyebrow';
    element.textContent = eyebrow;
    instrumentProp(item, 'eyebrow', element);
    copy.append(element);
  }
  if (title) {
    const heading = document.createElement('h3');
    heading.textContent = title;
    instrumentProp(item, 'title', heading);
    copy.append(heading);
  }
  const descriptionSource = propSource(item, 'description');
  if (descriptionSource?.textContent.trim()) {
    const description = createRichText(descriptionSource, 'highlight-description');
    instrumentProp(item, 'description', description);
    copy.append(description);
  }
  const statItems = modelItems(item, 'highlight-stat').filter((stat) => (
    ['value', 'unit', 'label', 'description'].some((name) => propText(stat, name))
  ));
  let scalarStats = [];
  try {
    const parsedMetrics = JSON.parse(propText(item, 'metrics') || '[]');
    if (Array.isArray(parsedMetrics)) scalarStats = parsedMetrics.slice(0, 4);
  } catch {
    scalarStats = [];
  }
  if (statItems.length || scalarStats.length) {
    const metrics = document.createElement('dl');
    metrics.className = 'highlight-metrics';
    statItems.forEach((stat) => metrics.append(createStat(stat)));
    if (!statItems.length) {
      scalarStats.forEach(({
        value, unit, label,
      }) => {
        const metric = document.createElement('div');
        metric.className = 'highlight-stat';
        const term = document.createElement('dt');
        term.textContent = label;
        instrumentProp(item, 'metrics', term);
        const detail = document.createElement('dd');
        detail.textContent = [value, unit].filter(Boolean).join(' ');
        instrumentProp(item, 'metrics', detail);
        metric.append(term, detail);
        metrics.append(metric);
      });
    }
    copy.append(metrics);
  }
  const note = propText(item, 'note');
  const showNote = propBoolean(item, 'showNote', Boolean(note));
  let noteElement = null;
  if (note && showNote) {
    noteElement = document.createElement('p');
    noteElement.className = 'highlight-note';
    noteElement.textContent = note;
    instrumentProp(item, 'note', noteElement);
    slide.classList.add('has-note');
  }
  const link = createProductLink(item);
  if (link) copy.append(link);
  if (copy.childElementCount) media.append(copy);
  slide.append(media);
  if (noteElement) slide.append(noteElement);
  moveItemInstrumentation(item, slide);
  return {
    element: slide,
    setMediaActive,
    destroyMedia,
  };
}

export default function decorate(block) {
  carouselInstances.get(block)?.();
  initProductBlock(block);
  const accentColor = propText(block, 'accentColor');
  if (accentColor) block.style.setProperty('--highlight-indicator', accentColor);
  const headingColor = propText(block, 'headingColor');
  if (['white', 'black'].includes(headingColor)) block.classList.add(`highlight-heading-${headingColor}`);
  const sectionTitle = propText(block, 'title');
  const autoPlay = propBoolean(block, 'autoPlay', true);
  const items = modelItems(block, 'highlight-slide');
  const shell = document.createElement('div');
  shell.className = 'highlight-shell';
  const header = createSectionHeader(block);
  const viewport = document.createElement('div');
  viewport.className = 'highlight-viewport';
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-roledescription', 'carousel');
  viewport.setAttribute('aria-label', sectionTitle.replaceAll('\n', ' ') || 'Product highlights');
  const track = document.createElement('div');
  track.className = 'highlight-track';
  const slideEntries = items.map((item, index) => createSlide(block, item, index));
  const slides = slideEntries.map(({ element }) => element);
  track.append(...slides);
  viewport.append(track);
  if (header.childElementCount) shell.append(header);
  shell.append(viewport);

  const eventController = new AbortController();
  const { signal } = eventController;
  let active = 0;
  let timer = null;
  let stagingFrame = null;
  let releaseFrame = null;
  let scrollSyncTimer = null;
  let rendered = false;
  let destroyed = false;
  let rotationPaused = false;
  let pointerActivatingRotation = false;
  let hovering = false;
  let rotationControl = null;
  let refreshControls = () => {};
  let refreshRotationControl = () => {};
  const interval = Math.min(12000, Math.max(2000, propNumber(block, 'interval', 4) * 1000));
  const listen = (target, type, handler, options = {}) => {
    target.addEventListener(type, handler, { ...options, signal });
  };
  const clearStaging = () => {
    if (stagingFrame !== null) window.cancelAnimationFrame(stagingFrame);
    if (releaseFrame !== null) window.cancelAnimationFrame(releaseFrame);
    stagingFrame = null;
    releaseFrame = null;
    slides.forEach((slide) => slide.classList.remove('is-instant', 'is-staging-hidden'));
  };
  const update = (next, scrollMobile = false) => {
    if (destroyed || !slides.length) return;
    clearStaging();
    const previousActive = active;
    active = (next + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const participatesInTransition = rendered && (index === previousActive || index === active);
      const stagesWithoutMotion = !participatesInTransition;
      slide.classList.toggle('is-instant', stagesWithoutMotion);
      slide.classList.toggle('is-staging-hidden', rendered && stagesWithoutMotion);
      slide.classList.toggle('is-active', index === active);
      slide.classList.toggle('is-previous', index === (active - 1 + slides.length) % slides.length);
      slide.classList.toggle('is-next', index === (active + 1) % slides.length);
      const inactive = index !== active;
      slide.setAttribute('aria-hidden', String(inactive));
      slide.toggleAttribute('inert', inactive);
      slideEntries[index].setMediaActive(!inactive);
    });
    track.getBoundingClientRect();
    stagingFrame = window.requestAnimationFrame(() => {
      slides.forEach((slide) => slide.classList.remove('is-staging-hidden'));
      track.getBoundingClientRect();
      stagingFrame = null;
      releaseFrame = window.requestAnimationFrame(() => {
        slides.forEach((slide) => slide.classList.remove('is-instant'));
        releaseFrame = null;
      });
    });
    rendered = true;
    shell.style.setProperty('--active-slide', active);
    refreshControls();
    if (scrollMobile && window.matchMedia(MOBILE_QUERY).matches) {
      slides[active].scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    }
  };
  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };
  const start = () => {
    stop();
    if (
      destroyed
      || rotationPaused
      || hovering
      || !autoPlay
      || slides.length < 2
      || prefersReducedMotion()
      || window.matchMedia(MOBILE_QUERY).matches
    ) return;
    timer = window.setInterval(() => update(active + 1), interval);
  };
  const pauseRotation = () => {
    rotationPaused = true;
    stop();
    refreshRotationControl();
  };
  const resumeRotation = () => {
    rotationPaused = false;
    refreshRotationControl();
    start();
  };
  if (slides.length > 1) {
    const controls = document.createElement('div');
    controls.className = 'highlight-controls';
    if (autoPlay && !prefersReducedMotion()) {
      rotationControl = document.createElement('button');
      rotationControl.type = 'button';
      rotationControl.className = 'highlight-rotation-control';
      refreshRotationControl = () => {
        rotationControl.classList.toggle('is-paused', rotationPaused);
        rotationControl.setAttribute(
          'aria-label',
          rotationPaused ? 'Start slide rotation' : 'Pause slide rotation',
        );
      };
      refreshRotationControl();
      listen(rotationControl, 'pointerdown', () => {
        pointerActivatingRotation = true;
      });
      listen(rotationControl, 'pointercancel', () => {
        pointerActivatingRotation = false;
      });
      listen(rotationControl, 'click', () => {
        pointerActivatingRotation = false;
        if (rotationPaused) resumeRotation();
        else pauseRotation();
      });
    }
    const dots = document.createElement('div');
    dots.className = 'highlight-dots';
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', 'Choose highlight');
    const indicatorLabels = items.map((item) => propText(item, 'indicatorLabel'));
    const hasIndicatorLabels = indicatorLabels.some(Boolean);
    if (hasIndicatorLabels) {
      controls.classList.add('has-indicator-labels');
      controls.style.setProperty('--highlight-slide-count', slides.length);
      dots.classList.add('has-labels');
    }
    const dotButtons = slides.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'highlight-dot';
      const labelText = indicatorLabels[index] || propText(items[index], 'title') || `Highlight ${index + 1}`;
      dot.setAttribute('aria-label', `Go to ${labelText.replaceAll('\n', ' ')}`);
      if (hasIndicatorLabels) {
        dot.classList.add('has-label');
        const label = document.createElement('span');
        label.className = 'highlight-dot-label';
        label.textContent = labelText;
        if (indicatorLabels[index]) instrumentProp(items[index], 'indicatorLabel', label);
        dot.append(label);
      }
      return dot;
    });
    dots.append(...dotButtons);
    const arrows = document.createElement('div');
    arrows.className = 'highlight-arrows';
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'highlight-arrow highlight-arrow-previous';
    previous.setAttribute('aria-label', 'Previous highlight');
    const status = document.createElement('div');
    status.className = 'highlight-status';
    status.setAttribute('aria-live', 'polite');
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'highlight-arrow highlight-arrow-next';
    next.setAttribute('aria-label', 'Next highlight');
    refreshControls = () => {
      status.textContent = `Highlight ${active + 1} of ${slides.length}`;
      dotButtons.forEach((dot, index) => {
        dot.classList.toggle('is-active', index === active);
        if (index === active) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    };
    dotButtons.forEach((dot, index) => {
      listen(dot, 'click', () => {
        pauseRotation();
        update(index, true);
      });
    });
    listen(previous, 'click', () => {
      pauseRotation();
      update(active - 1, true);
    });
    listen(next, 'click', () => {
      pauseRotation();
      update(active + 1, true);
    });
    arrows.append(previous, next);
    if (rotationControl) controls.append(rotationControl);
    controls.append(dots, arrows, status);
    shell.append(controls);
    refreshControls();
    const syncMobileScroll = () => {
      if (!window.matchMedia(MOBILE_QUERY).matches) return;
      const closest = slides.map((slide, index) => ({
        index,
        distance: Math.abs(slide.offsetLeft - viewport.scrollLeft),
      })).sort((a, b) => a.distance - b.distance)[0];
      update(closest.index);
    };
    if ('onscrollend' in viewport) {
      listen(viewport, 'scrollend', syncMobileScroll);
    } else {
      listen(viewport, 'scroll', () => {
        if (scrollSyncTimer !== null) window.clearTimeout(scrollSyncTimer);
        scrollSyncTimer = window.setTimeout(() => {
          scrollSyncTimer = null;
          syncMobileScroll();
        }, 120);
      });
    }
  }
  listen(shell, 'mouseenter', () => {
    hovering = true;
    stop();
  });
  listen(shell, 'mouseleave', () => {
    hovering = false;
    start();
  });
  listen(shell, 'focusin', () => {
    if (!pointerActivatingRotation) pauseRotation();
  });
  const cleanup = () => {
    if (destroyed) return;
    destroyed = true;
    stop();
    clearStaging();
    if (scrollSyncTimer !== null) window.clearTimeout(scrollSyncTimer);
    scrollSyncTimer = null;
    eventController.abort();
    slideEntries.forEach(({ destroyMedia }) => destroyMedia());
    if (carouselInstances.get(block) === cleanup) carouselInstances.delete(block);
  };
  carouselInstances.set(block, cleanup);
  listen(block, 'aem:block-unload', cleanup, { once: true });
  addBlockAnchor(block, block, shell);
  block.replaceChildren(shell);
  if (slides.length) update(0);
  start();
  revealElements(block, '.product-section-header');
}
