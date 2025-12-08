/**
 * Avatar Block - Optimized with lit-html
 *
 * This version uses:
 * - `ref` directive to avoid querySelector calls
 * - Cleaner data extraction with reduce
 * - Single-pass instrumentation application
 */
import {
  html, render, nothing, createRef, ref,
} from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const SIZES = ['small', 'medium', 'large'];

/**
 * Extract data from block rows
 */
function extractData(block) {
  const rows = [...block.children];

  // Use reduce for cleaner extraction
  const extracted = rows.reduce((acc, row) => {
    const text = row.textContent.trim().toLowerCase();

    if (!acc.imageRow && row.querySelector('picture')) {
      acc.imageRow = row;
      acc.picture = row.querySelector('picture');
    } else if (SIZES.includes(text)) {
      acc.size = text;
    } else if (text && !SIZES.includes(text)) {
      if (!acc.nameRow) {
        acc.nameRow = row;
        acc.name = row.textContent.trim();
      } else if (!acc.titleRow) {
        acc.titleRow = row;
        acc.title = row.textContent.trim();
      }
    }
    return acc;
  }, { size: 'medium' });

  // Block class takes precedence
  const blockSize = SIZES.find((s) => block.classList.contains(s));
  extracted.sizeClass = `size-${blockSize || extracted.size}`;

  return extracted;
}

/**
 * Apply instrumentation from source row to target element
 */
function applyField(sourceRow, targetRef, content, isElement = false) {
  const el = targetRef.value;
  if (!sourceRow || !el) return;

  moveInstrumentation(sourceRow, el);
  if (isElement) {
    el.appendChild(content);
  } else {
    el.textContent = content;
  }
}

/**
 * Decorate the avatar block
 */
export default function decorate(block) {
  const data = extractData(block);
  const { sizeClass, name, title } = data;

  // Create refs for instrumented elements
  const imageRef = createRef();
  const nameRef = createRef();
  const titleRef = createRef();

  // Clear and render
  block.textContent = '';
  render(html`
    <div class="avatar-container ${sizeClass}">
      <div class="avatar-image-wrapper" ${ref(imageRef)}></div>
      ${(name || title) ? html`
        <div class="avatar-info">
          ${name ? html`<h3 class="avatar-name" ${ref(nameRef)}></h3>` : nothing}
          ${title ? html`<p class="avatar-title" ${ref(titleRef)}></p>` : nothing}
        </div>
      ` : nothing}
    </div>
  `, block);

  // Apply instrumentation in one go
  applyField(data.imageRow, imageRef, data.picture, true);
  applyField(data.nameRow, nameRef, data.name);
  applyField(data.titleRow, titleRef, data.title);
}
