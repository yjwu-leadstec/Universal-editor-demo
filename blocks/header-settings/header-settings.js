const FIELD_NAMES = [
  'primaryNavigationLabel',
  'openNavigationLabel',
  'closeNavigationLabel',
  'backNavigationLabel',
  'localeDialogTitle',
  'localeTriggerLabel',
  'localeCloseLabel',
];

function directCells(block) {
  return [...block.children].flatMap((row) => (
    row.children.length ? [...row.children] : [row]
  ));
}

/**
 * Preserve the authored settings DOM while exposing a stable parser contract to header.js.
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const cells = directCells(block);
  const directoryCell = block.querySelector('[data-aue-prop="localeDirectory"]')
    || cells.find((cell) => cell.querySelector('a'))
    || cells[0];
  const directoryLink = directoryCell?.querySelector('a');
  const labels = cells.filter((cell) => cell !== directoryCell)
    .map((cell) => cell.textContent.trim());

  if (directoryLink) block.dataset.localeDirectory = directoryLink.getAttribute('href') || '';
  FIELD_NAMES.forEach((field, index) => {
    if (labels[index]) block.dataset[field] = labels[index];
  });
  block.dataset.headerSettings = 'true';
}
