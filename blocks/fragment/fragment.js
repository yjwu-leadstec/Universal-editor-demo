/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

import {
  decorateMain,
} from '../../scripts/scripts.js';

import {
  loadSections,
} from '../../scripts/aem.js';

const pendingFragments = new Map();

function normalizeFragmentPath(path) {
  if (!path || !path.startsWith('/')) return '';
  return path.replace(/(?:\.plain)?\.html(?:[?#].*)?$/i, '').replace(/\/+$/, '') || '/';
}

async function fetchFragmentText(path) {
  if (pendingFragments.has(path)) return pendingFragments.get(path);
  const request = fetch(`${path}.plain.html`)
    .then((response) => (response.ok ? response.text() : null))
    .catch(() => null);
  pendingFragments.set(path, request);
  try {
    return await request;
  } finally {
    if (pendingFragments.get(path) === request) pendingFragments.delete(path);
  }
}

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  const fragmentPath = normalizeFragmentPath(path);
  if (!fragmentPath) return null;
  const content = await fetchFragmentText(fragmentPath);
  if (content === null) return null;

  const main = document.createElement('main');
  main.innerHTML = content;

  // reset base path for media to fragment base
  const resetAttributeBase = (tag, attr) => {
    main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
      elem[attr] = new URL(elem.getAttribute(attr), new URL(fragmentPath, window.location)).href;
    });
  };
  resetAttributeBase('img', 'src');
  resetAttributeBase('source', 'srcset');

  decorateMain(main);
  await loadSections(main);
  return main;
}

/**
 * Load the first available fragment from an ordered candidate list.
 * @param {string[]} candidates
 * @returns {Promise<{fragment: HTMLElement|null, path: string}>}
 */
export async function loadFragmentCandidates(candidates) {
  // eslint-disable-next-line no-restricted-syntax
  for (const path of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const fragment = await loadFragment(path);
    if (fragment) return { fragment, path: normalizeFragmentPath(path) };
  }
  return { fragment: null, path: '' };
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    if (fragmentSection) {
      block.classList.add(...fragmentSection.classList);
      block.classList.remove('section');
      block.replaceChildren(...fragmentSection.childNodes);
    }
  }
}
