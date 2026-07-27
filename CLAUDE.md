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
- **Reload with cache bypass.** A plain reload can re-serve CSS/JS from Chrome's disk cache even
  after a correct deploy, so the page renders the old build while `curl` shows the new one —
  which reads as "my fix didn't work". Verify the computed style actually changed before
  concluding anything about the code.
- **Measure the settled state.** Sampling mid-transition, or reusing an element index captured
  before a click, produces numbers that look like bugs but are measurement artifacts. When a
  reading looks wrong, re-measure after the animation settles before changing code.
- **Close every tab you opened** once the check is done. Leave the tabs the user already had
  open alone.

## Atomic Development

**Reuse shared logic where it genuinely fits; where it does not, give the block its own copy
rather than bending the shared code to fit.**

A block should not inherit behaviour it never asked for, and a change made for one block
should not be able to break another. When a shared helper almost fits, copying it into the
block is the cheaper mistake — a wrong shared abstraction spreads bugs to every consumer.

`blocks/lixiang-product-intro-slider/` is the worked example: it owns `slider-utils.js` and
its own `product-*` CSS instead of importing `scripts/product-block-utils.js` and
`styles/product-blocks.css`. The trade-off is real and accepted — fixes to the shared files
do **not** reach it, so they have to be ported by hand.

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
Template = `blocks/feature-grid/`; reuse the shared helpers in `scripts/product-block-utils.js` (`initProductBlock` / `createSectionHeader` / `createMedia` / `modelItems` / `instrumentProp` / `moveItemInstrumentation` / `addBlockAnchor` / `revealElements`) **where they fit as-is** — if the block needs different behaviour, give it its own copy instead of adding branches to the shared file (see Atomic Development). `decorate()` must call `addBlockAnchor(block, block, shell)` **before** `block.replaceChildren(shell)` or the Universal Editor canvas loses field editability. Beyond `blocks/<name>/{<name>.js,.css,_<name>.json}`, three existing files must also be edited or the build/delivery breaks:
- `scripts/product-block-utils.js` — register the block + each item model in **both** `PRODUCT_MODEL_FIELDS` and `PRODUCT_COLLECTION_MODELS` (else doc-based aem.live delivery can't rebuild field markers / detect groups → fields render empty). The field list is **positional and must match `_<name>.json` exactly**: the editor often instruments only the collection items and leaves the block's own cells bare, and `restoreBlockFields` maps those cells by position. Delivery also omits cells for empty values, so entries are matched by field type — reordering or inserting a field mid-list silently shifts every field after it.
- `.eslintrc.js` — add any model with >4 fields to `xwalk/max-cells` (else `npm run lint` / the pre-commit hook fails).
- `models/_section.json` — add the block id to `filters[0].components` (else authors can't insert it into a section).

When a parent model and its child model share a field name, check that the parent actually
declares that field. `propSource` only rejects a match owned by a nested `[data-aue-model]`
because of an explicit guard; before that guard, a parent lacking the field would claim its
first child's field and strip that child's instrumentation, so the value rendered in the
wrong place and the child became uneditable.

**Nested collection items ship as siblings, not children.** Delivery flattens a nested
collection so each child follows its parent in document order. `modelItems(parent, 'child')`
searches inside the parent and finds nothing — authored items then never render. Use
`groupChildItems(block, parents, childModel)` (in `scripts/product-block-utils.js`, used by
`spec-table` and `icon-overlay-showcase`; the slider keeps its own copy) to walk block children
and attach each child to the preceding parent.

**Field entries are `[name, component, label]` triples.** The content tree names a field from
`data-aue-label` and picks its editor from `data-aue-type`; writing only `data-aue-prop` leaves
the tree showing the raw key (an authored "Title" appears as `Property`). `markField` writes all
three — keep the label in the field table in sync with the model's `label`.

**Exception — `blocks/lixiang-product-intro-slider/`** is deliberately self-contained. It uses
its own `slider-utils.js` and keeps its `product-*` CSS in its own stylesheet, so it imports
neither `scripts/product-block-utils.js` nor `styles/product-blocks.css`. Fixes to those
shared files do **not** reach it — port them across by hand. Its `PRODUCT_MODEL_FIELDS` copy
is positional, so any field reorder in `_lixiang-product-intro-slider.json` must be mirrored
in `slider-utils.js`. Note it still sets `data-product-block` (its own selectors depend on the
attribute) and still restates `min-height: 0` on `.product-media`, because other blocks on the
same page inject the shared stylesheet whose equally-specific rule would otherwise win.
Its carousel moves one flex track with loop clones — before touching the animation, sizing, or
breakpoints, read `docs/lixiang-product-intro-slider-carousel-architecture.md`; changing a card
width without its matching `--highlight-step` breaks the step, and `CLONE_DEPTH` must stay
≥ visible neighbours + 1.


### Service page blocks (`lixiang-service-hero`, `lixiang-service-feature-panel`)
These do **not** follow the site's three-tier layout. The live site drives them from a single
`720px` desktop/mobile switch plus a fluid root unit (`--lixiang-service-rem`: 112px above 1440,
84px to 1025, `8.3333vw` below), so `1440` and `1024` change scale only, never structure. Desktop
lengths are written `calc(<px-at-1920> * var(--lixiang-service-unit))`. Before changing their
breakpoints, sizing, or full-bleed behaviour, read `docs/service-page-breakpoint-alignment.md`.

**A block's delivery class comes from the JCR `name` property, not the node name.** `name: "Lixiang
Service Hero"` renders `class="lixiang-service-hero"`. Renaming a block therefore means editing
authored content (`model`, `name`, and `filter` on every node), not just moving files — otherwise
existing pages render blank. Node renames also reset sibling order, so re-check document order
afterwards.

**Never full-bleed a block with `width: 100vw`.** `100vw` includes the scrollbar, so the block sits
~7.5px left of the page on desktop. Neutralise the section wrapper instead
(`main .section > .<block>-wrapper { max-width: none; padding: 0; }`) and keep the gutter on an
inner shell.

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

Content paths drop the `/content/demo-site/` prefix the author instance uses: the L6 page authored
at `/content/demo-site/language-master/en/li-l6` is delivered at
`https://main--universal-editor-demo--yjwu-leadstec.aem.page/language-master/en/li-l6`. Passing the
full author path returns 404. This delivery URL is the fastest way to verify a rendered page — it
needs no AEM session, unlike the Universal Editor canvas.
