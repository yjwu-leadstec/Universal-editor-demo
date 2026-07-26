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
} from './slider-utils.js';

const MOBILE_QUERY = '(width <= 720px)';
// Matches the .highlight-track transition duration: the wrap snap must land
// once the animation onto the clone has finished.
const WRAP_SETTLE_MS = 400;
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

function createSlide(block, item, index, statItems = []) {
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
  const stats = statItems.filter((stat) => (
    ['value', 'unit', 'label', 'description'].some((name) => propText(stat, name))
  ));
  if (stats.length) {
    const metrics = document.createElement('dl');
    metrics.className = 'highlight-metrics';
    stats.forEach((stat) => metrics.append(createStat(stat)));
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

// Nested collection items are delivered as siblings of their parent rather than
// as its children, with order carrying the relationship -- each highlight-stat
// belongs to the highlight-slide that precedes it. Reading them with
// modelItems(slide, ...) finds nothing, which is why authored statistics never
// rendered.
function groupSlideStats(block, slides) {
  const slideSet = new Set(slides);
  const statSet = new Set(modelItems(block, 'highlight-stat'));
  const byslide = new Map(slides.map((slide) => [slide, []]));
  let current = null;
  [...block.children].forEach((child) => {
    if (slideSet.has(child)) {
      current = child;
      return;
    }
    if (statSet.has(child) && current) byslide.get(current).push(child);
  });
  return byslide;
}

export default function decorate(block) {
  carouselInstances.get(block)?.();
  initProductBlock(block);
  const accentColor = propText(block, 'accentColor');
  if (accentColor) block.style.setProperty('--highlight-indicator', accentColor);
  // `background` and `spacing` replace the combined `classes` multiselect. AEM only
  // turns a field literally named `classes` into block classes, so apply these two
  // by hand. Text colour follows the background variables, so there is no separate
  // heading-colour field: white on dark/gray, black on light.
  const background = propText(block, 'background');
  if (['light', 'dark', 'gray'].includes(background)) block.classList.add(background);
  const spacing = propText(block, 'spacing');
  if (['space-large', 'space-small', 'space-none'].includes(spacing)) block.classList.add(spacing);
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
  const statsBySlide = groupSlideStats(block, items);
  const slideEntries = items.map(
    (item, index) => createSlide(block, item, index, statsBySlide.get(item) || []),
  );
  const slides = slideEntries.map(({ element }) => element);
  // Loop clones, the way Swiper/Slick do it: a copy of the last slide sits
  // before the first and a copy of the first sits after the last. Without them a
  // linear strip has nothing to show past either end -- no neighbour peeked at
  // slide 0, and wrapping swept the whole track instead of stepping one card.
  // Clones are decorative duplicates: strip editor instrumentation and any
  // video so the Universal Editor never sees a second copy of a field and the
  // browser never decodes the same clip twice.
  const cloneSlide = (slide) => {
    const clone = slide.cloneNode(true);
    clone.classList.add('is-clone');
    clone.classList.remove('is-active');
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('inert', '');
    clone.querySelectorAll('video, .product-video-control').forEach((node) => node.remove());
    [clone, ...clone.querySelectorAll('*')].forEach((node) => {
      Object.keys(node.dataset)
        .filter((key) => key.startsWith('aue') || key.startsWith('richtext'))
        .forEach((key) => delete node.dataset[key]);
      node.removeAttribute('id');
    });
    return clone;
  };
  const looped = slides.length > 1;
  const headClone = looped ? cloneSlide(slides[slides.length - 1]) : null;
  const tailClone = looped ? cloneSlide(slides[0]) : null;
  if (looped) track.append(headClone, ...slides, tailClone);
  else track.append(...slides);
  viewport.append(track);
  if (header.childElementCount) shell.append(header);
  shell.append(viewport);

  const eventController = new AbortController();
  const { signal } = eventController;
  let active = 0;
  let timer = null;
  let releaseFrame = null;
  let wrapTimer = null;
  let scrollSyncTimer = null;
  let rendered = false;
  let destroyed = false;
  let rotationPaused = false;
  let hovering = false;
  let refreshControls = () => {};
  const interval = Math.min(12000, Math.max(2000, propNumber(block, 'interval', 4) * 1000));
  const listen = (target, type, handler, options = {}) => {
    target.addEventListener(type, handler, { ...options, signal });
  };
  const clearStaging = () => {
    if (releaseFrame !== null) window.cancelAnimationFrame(releaseFrame);
    releaseFrame = null;
    track.classList.remove('is-instant');
  };
  // After the track animates onto a clone, drop the transition and move to the
  // matching real slide. transitionend can be missed (an interrupted transform
  // fires nothing), so a timer bounded by the CSS duration is the reliable
  // trigger; the visual is identical either way because clone and original show
  // the same card.
  const settleWrap = (position) => {
    if (wrapTimer) window.clearTimeout(wrapTimer);
    wrapTimer = window.setTimeout(() => {
      wrapTimer = null;
      if (destroyed) return;
      track.classList.add('is-instant');
      track.style.setProperty('--active-slide', position);
      track.getBoundingClientRect();
      releaseFrame = window.requestAnimationFrame(() => {
        track.classList.remove('is-instant');
        releaseFrame = null;
      });
    }, WRAP_SETTLE_MS);
  };
  const update = (next, scrollMobile = false) => {
    if (destroyed || !slides.length) return;
    const previous = active;
    active = (next + slides.length) % slides.length;
    // The strip moves as one: the track carries a single transform driven by
    // --active-slide, so every card travels the same distance in the same
    // direction. The first paint jumps straight to the active slide instead of
    // animating in from slide 0.
    //
    // With loop clones the track is offset by one slide, so index i sits at
    // i + 1. Stepping off either end animates onto the neighbouring clone
    // first, then snaps -- with the transition suppressed -- to the identical
    // real slide. The jump is invisible because both show the same card.
    const wrappedForward = looped && previous === slides.length - 1 && active === 0;
    const wrappedBack = looped && previous === 0 && active === slides.length - 1;
    const offset = looped ? 1 : 0;
    let position = active + offset;
    if (wrappedForward) position = slides.length + offset;
    if (wrappedBack) position = offset - 1;
    track.classList.toggle('is-instant', !rendered);
    track.style.setProperty('--active-slide', position);
    slides.forEach((slide, index) => {
      const inactive = index !== active;
      slide.classList.toggle('is-active', !inactive);
      slide.setAttribute('aria-hidden', String(inactive));
      slide.toggleAttribute('inert', inactive);
      slideEntries[index].setMediaActive(!inactive);
    });
    if (!rendered) {
      track.getBoundingClientRect();
      releaseFrame = window.requestAnimationFrame(() => {
        track.classList.remove('is-instant');
        releaseFrame = null;
      });
    } else if (wrappedForward || wrappedBack) {
      settleWrap(active + offset);
    }
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
  };
  if (slides.length > 1) {
    const controls = document.createElement('div');
    controls.className = 'highlight-controls';
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
    pauseRotation();
  });
  const cleanup = () => {
    if (destroyed) return;
    destroyed = true;
    stop();
    clearStaging();
    if (scrollSyncTimer !== null) window.clearTimeout(scrollSyncTimer);
    scrollSyncTimer = null;
    if (wrapTimer !== null) window.clearTimeout(wrapTimer);
    wrapTimer = null;
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
