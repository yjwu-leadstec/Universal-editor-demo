import { moveInstrumentation } from '../../scripts/scripts.js';

const MARKET_CODE_PATTERN = /^[a-z][a-z0-9-]{1,15}$/;

function directTextCells(row) {
  return [...row.children]
    .filter((cell) => !cell.querySelector('a'))
    .map((cell) => cell.textContent.trim());
}

function validLanguageTag(value) {
  try {
    return Intl.getCanonicalLocales(String(value || '').replace(/_/g, '-'))[0] || '';
  } catch {
    return '';
  }
}

function extractOption(row) {
  const anchor = row.querySelector('a[href]');
  const [
    marketCode = '',
    marketLabel = '',
    languageTagRaw = '',
    languageLabel = '',
    enabledRaw = 'false',
    directionRaw = 'ltr',
  ] = directTextCells(row);
  const languageTag = validLanguageTag(languageTagRaw);
  const direction = directionRaw.toLowerCase();
  const enabled = enabledRaw.toLowerCase() === 'true';
  if (!enabled
    || !MARKET_CODE_PATTERN.test(marketCode)
    || !marketLabel
    || !languageTag
    || !languageLabel
    || !anchor
    || !['ltr', 'rtl'].includes(direction)) return null;
  return {
    row,
    marketCode,
    marketLabel,
    languageTag,
    languageLabel,
    href: anchor.getAttribute('href'),
    direction,
  };
}

/**
 * Render locale options as semantic links that remain useful without header enhancement.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const options = [...block.children].map(extractOption).filter(Boolean);
  if (!options.length) return;

  const list = document.createElement('div');
  list.className = 'locale-directory-list';
  list.setAttribute('role', 'list');
  options.forEach((option) => {
    const item = document.createElement('div');
    item.className = 'locale-directory-option';
    item.setAttribute('role', 'listitem');
    item.dataset.localeOption = 'true';
    item.dataset.marketCode = option.marketCode;
    item.dataset.marketLabel = option.marketLabel;
    item.dataset.languageTag = option.languageTag;
    item.dataset.textDirection = option.direction;

    const market = document.createElement('span');
    market.className = 'locale-directory-market';
    market.textContent = option.marketLabel;
    const link = document.createElement('a');
    link.className = 'locale-directory-link';
    link.href = option.href;
    link.hreflang = option.languageTag;
    link.textContent = option.languageLabel;
    item.append(market, link);
    moveInstrumentation(option.row, item);
    list.append(item);
  });
  block.replaceChildren(list);
}
