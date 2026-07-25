<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AEM Edge Delivery Services project configured for the Universal Editor, providing visual editing capabilities for Franklin blocks. Content is sourced from AEM Cloud Service author instance and delivered through Edge Delivery.

## Git Workflow — main only

**Develop, push, and test on `main`. Do not use feature branches, worktrees, or PRs.**

`fstab.yaml` hardcodes the delivery mountpoint to `.../Universal-editor-demo/main`, so the
Universal Editor only ever loads code from `main`. Anything on another branch cannot be
verified on the environment, which makes it unverifiable per the rule below.

- Sync before pushing — this repo has other active contributors:
  ```bash
  git fetch origin && git rebase origin/main
  ```
- Do not create git worktrees. Their generated branch names exceed the 63-character DNS
  label limit, and `aem up` refuses to start.

## Verification Requirement

**A change is only done once it is pushed to `main` and verified on the environment.**

`npm run lint` and `npm test` are entry gates, **not** acceptance criteria. Local test runs
and local fixtures do **not** count as verified, and must never be reported as "tested",
"verified", or "fixed".

Local fixtures load a single block in isolation. A real page has many blocks, and the other
product blocks inject `styles/product-blocks.css` at runtime — its rules share specificity
with a block's own and load first. Cascade bugs of this shape are invisible locally and only
appear on the environment.

Workflow: edit → `npm run lint` + `npm test` → commit → push to `main` → wait for deploy →
**verify on the environment**. Until that last step passes, say "pushed, not yet verified on
the environment" rather than "fixed".

### Verifying on the environment

- Universal Editor canvas (**same-origin, works**):
  `https://author-p80707-e1685574.adobeaemcloud.com/ui#/@leadstechltdptrsd/aem/universal-editor/canvas/author-p80707-e1685574.adobeaemcloud.com/content/demo-site/language-master/en/li-l6.html`
- The `experience.adobe.com` entry point does **not** work: the canvas is a cross-site iframe,
  the AEM session cookie is not sent, and it fails with `ERR_BLOCKED_BY_RESPONSE`.
- Drive a real Chrome over CDP (the web-access skill). A standalone Playwright browser has no
  AEM session.
- **Open a new tab.** An already-open editor tab can render a cached view — including nodes
  that no longer exist.
- When checking deployed assets, use `curl --compressed`; otherwise the response is raw gzip
  and every `grep` silently misses.

## Development Commands

```bash
# Install dependencies
npm i

# Start local development server (opens http://localhost:3000)
aem up

# Run all linters
npm run lint

# Run JavaScript/CSS linting separately
npm run lint:js
npm run lint:css

# Fix linting issues automatically
npm run lint:fix

# Build component JSON models (merges models/*.json into root)
npm run build:json
```

**Prerequisites**: Node.js 18.3.x+, AEM CLI (`npm install -g @adobe/aem-cli`)

## Architecture

### Block System
Each block in `/blocks/[name]/` contains:
- `[name].js` - Main `decorate(block)` function
- `[name].css` - Block styles
- `_[name].json` - Universal Editor model (optional, lives in `/models/`)

### Two Block Patterns

**DOM manipulation (traditional)** — Used by blocks like `cards`:
```javascript
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  // Restructure DOM, move instrumentation, append to block
  moveInstrumentation(row, newElement);
  block.textContent = '';
  block.append(newElement);
}
```

**lit-html templating** — Preferred for new blocks with complex rendering:
```javascript
import { html, render, nothing, createRef, ref } from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  const fieldRef = createRef();

  block.textContent = '';
  render(html`
    <div class="my-block">
      <div ${ref(fieldRef)}></div>
    </div>
  `, block);

  moveInstrumentation(sourceRow, fieldRef.value);
}
```

Available lit-html exports: `html`, `svg`, `render`, `nothing`, `noChange`, `unsafeHTML`, `repeat`, `classMap`, `styleMap`, `ref`, `createRef`

### Universal Editor Instrumentation
The `moveInstrumentation(source, target)` function transfers `data-aue-*` and `data-richtext-*` attributes from content rows to decorated elements, enabling in-context editing. Every block must preserve instrumentation for the Universal Editor to work.

### Component Model System
- Source models in `/models/_*.json` define field types
- `npm run build:json` merges into root JSON files:
  - `component-models.json` - Field definitions
  - `component-definition.json` - UI configuration
  - `component-filters.json` - Placement rules
- **Husky pre-commit hook** automatically runs `build:json` and stages the merged files when any `_*.json` model file is committed — no manual rebuild needed.

### Adding a product-series block (checklist)
Template = `blocks/feature-grid/`; reuse the shared helpers in `scripts/product-block-utils.js` (`initProductBlock` / `createSectionHeader` / `createMedia` / `modelItems` / `instrumentProp` / `moveItemInstrumentation` / `addBlockAnchor` / `revealElements`). `decorate()` must call `addBlockAnchor(block, block, shell)` **before** `block.replaceChildren(shell)` or the Universal Editor canvas loses field editability. Beyond `blocks/<name>/{<name>.js,.css,_<name>.json}`, three existing files must also be edited or the build/delivery breaks:
- `scripts/product-block-utils.js` — register the block + each item model in **both** `PRODUCT_MODEL_FIELDS` and `PRODUCT_COLLECTION_MODELS` (else doc-based aem.live delivery can't rebuild field markers / detect groups → fields render empty).
- `.eslintrc.js` — add any model with >4 fields to `xwalk/max-cells` (else `npm run lint` / the pre-commit hook fails).
- `models/_section.json` — add the block id to `filters[0].components` (else authors can't insert it into a section).

**Exception — `blocks/lixiang-product-intro-slider/`** is deliberately self-contained. It uses
its own `slider-utils.js` and keeps its `product-*` CSS in its own stylesheet, so it imports
neither `scripts/product-block-utils.js` nor `styles/product-blocks.css`. Fixes to those
shared files do **not** reach it — port them across by hand. Its `PRODUCT_MODEL_FIELDS` copy
is positional, so any field reorder in `_lixiang-product-intro-slider.json` must be mirrored
in `slider-utils.js`. Note it still sets `data-product-block` (its own selectors depend on the
attribute) and still restates `min-height: 0` on `.product-media`, because other blocks on the
same page inject the shared stylesheet whose equally-specific rule would otherwise win.


### Script Loading Phases
- **Eager** (`loadEager`): Critical above-the-fold content, first section only
- **Lazy** (`loadLazy`): Remaining sections, header, footer, lazy-styles.css
- **Delayed** (`loadDelayed`): Analytics and non-critical features (3s delay)

### Core Utilities (scripts/aem.js)
- `loadBlock()` / `decorateBlock()` - Block loading and decoration
- `buildBlock()` - Programmatic block creation
- `createOptimizedPicture(src, alt, eager, breakpoints)` - Generate responsive `<picture>` elements with WebP
- `decorateSections()` / `decorateButtons()` / `decorateIcons()` - Standard decorations

### Editor Support
- `scripts/editor-support.js` - Handles `aue:content-patch/update/add/move/remove/copy` events for live re-decoration without full reload
- `scripts/editor-support-rte.js` - Rich text editing support with MutationObserver for dynamic instrumentation

## Linting Rules

**ESLint**: `airbnb-base` + `plugin:xwalk/recommended`
- `.js` extension required in all imports
- Unix linebreaks enforced
- Parameter property modification allowed (`no-param-reassign` props: false)
- Custom cell limits: carousel: 6, slide: 8 (`xwalk/max-cells`)

**Stylelint**: `stylelint-config-standard`

## Content Source

Content is delivered from AEM Cloud Service via the `fstab.yaml` mountpoint configuration pointing to the author instance (markup type with `.html` suffix).

## Environment URLs
- Preview: `https://main--{repo}--{owner}.aem.page/`
- Live: `https://main--{repo}--{owner}.aem.live/`
