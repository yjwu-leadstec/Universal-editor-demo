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
