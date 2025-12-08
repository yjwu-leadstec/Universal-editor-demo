/**
 * lit-html wrapper for Adobe EDS projects
 * This module re-exports lit-html functions for use in block decorators.
 *
 * @example
 * import { html, render } from '../../scripts/lit.js';
 *
 * export default function decorate(block) {
 *   const template = html`<div class="my-block">${content}</div>`;
 *   render(template, block);
 * }
 */

// Core lit-html exports
export {
  html, svg, render, nothing, noChange,
} from './lib/lit-html/lit-html.js';

// Common directives
export { unsafeHTML } from './lib/lit-html/directives/unsafe-html.js';
export { repeat } from './lib/lit-html/directives/repeat.js';
export { classMap } from './lib/lit-html/directives/class-map.js';
export { styleMap } from './lib/lit-html/directives/style-map.js';
export { ref, createRef } from './lib/lit-html/directives/ref.js';
