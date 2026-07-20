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

# Repository Guidelines

## Project Overview

This is the deployable implementation layer for the Li Auto Global English website migration. It is an AEM Edge Delivery Services project configured for Universal Editor visual editing of Franklin blocks. Content is sourced from an AEM Cloud Service author instance and delivered through Edge Delivery.

## Development Commands

```bash
npm i            # Install dependencies
aem up           # Start the local proxy at http://localhost:3000
npm run lint     # Run JavaScript and CSS linting
npm run lint:js  # Run ESLint only
npm run lint:css # Run Stylelint only
npm run lint:fix # Apply automatic lint fixes
npm run build:json # Merge partial models into the root component JSON files
```

Prerequisites: Node.js 18.3.x or newer and AEM CLI (`npm install -g @adobe/aem-cli`). Run commands from this repository root.

## Architecture

### Block System

Each block lives in `blocks/<name>/` and normally contains:

- `<name>.js` — the main `decorate(block)` function.
- `<name>.css` — block-scoped styles.
- `_<name>.json` — the block's Universal Editor models, definitions, and filters.

Shared model partials live in `models/_*.json`. The three model entry points under `models/` include block partials through `../blocks/*/_*.json`.

### Two Block Patterns

Traditional DOM manipulation is suitable for simple blocks such as `cards`:

```javascript
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const [row] = [...block.children];
  const newElement = document.createElement('div');
  newElement.textContent = row.textContent;
  // Restructure DOM, move instrumentation, append to block.
  moveInstrumentation(row, newElement);
  block.textContent = '';
  block.append(newElement);
}
```

Use the local lit-html wrapper for new blocks with complex rendering:

```javascript
import { html, render, createRef, ref } from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const [sourceRow] = [...block.children];
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

Available exports from `scripts/lit.js`: `html`, `svg`, `render`, `nothing`, `noChange`, `unsafeHTML`, `repeat`, `classMap`, `styleMap`, `ref`, and `createRef`.

### Universal Editor Instrumentation

`moveInstrumentation(source, target)` transfers `data-aue-*` and `data-richtext-*` attributes from source content to decorated elements. Every block that restructures authored markup must preserve this instrumentation so in-context editing continues to work.

### Component Model System

- `models/_component-models.json`, `models/_component-definition.json`, and `models/_component-filters.json` are the merge entry points.
- Shared content models live in `models/_*.json`; block-specific models live in `blocks/*/_*.json`.
- `npm run build:json` produces `component-models.json`, `component-definition.json`, and `component-filters.json` in the repository root.
- The Husky pre-commit hook runs `build:json` and stages all three generated files whenever a staged `_<name>.json` partial changes. Run it manually when validating model work before commit.

### Script Loading Phases

- **Eager** (`loadEager`): critical above-the-fold content and the first section.
- **Lazy** (`loadLazy`): remaining sections, header, footer, fonts, and `lazy-styles.css`.
- **Delayed** (`loadDelayed`): analytics and other non-critical features after a 3-second delay.

### Core Utilities

`scripts/aem.js` provides `loadBlock()`, `decorateBlock()`, `buildBlock()`, `createOptimizedPicture()`, `decorateSections()`, `decorateButtons()`, and `decorateIcons()`.

### Editor Support

- `scripts/editor-support.js` handles `aue:content-patch/update/add/move/remove/copy` events and re-decorates affected content without a full reload.
- `scripts/editor-support-rte.js` supports rich-text editing and dynamically added instrumentation.

## Linting Rules

- ESLint uses `airbnb-base` and `plugin:xwalk/recommended`.
- JavaScript imports require the `.js` extension and Unix line endings.
- Parameter property modification is allowed (`no-param-reassign` with `props: false`).
- The xwalk cell limits are 6 for carousel and 8 for slide.
- CSS uses `stylelint-config-standard`.

## Content Source and Environments

`fstab.yaml` mounts AEM Cloud Service author content as `markup` with an `.html` suffix.

- Preview: `https://main--{repo}--{owner}.aem.page/`
- Live: `https://main--{repo}--{owner}.aem.live/`

## AEM Author 内容路径

当前 EDS 项目的页面内容统一维护在以下 AEM Author 路径：

- Sites 控制台：[打开当前 EDS 内容目录](https://author-p80707-e1685574.adobeaemcloud.com/ui#/aem/sites.html/content/demo-site/language-master/en)
- JCR 内容根路径：`/content/demo-site/language-master/en`
- 环境：`author-p80707-e1685574.adobeaemcloud.com`

新增或更新英文页面内容时，默认使用该内容根路径，不得自行切换到其他站点、语言根或 AEM 环境。该路径属于可变的项目配置；只有用户明确提供更新后的路径时才修改本记录，并从新路径继续后续内容同步。

## Homepage Banner 强制规则

- Homepage 的 `home-banner` 是桌面端、平板端和移动端都必须显示的正式页面内容；移动端 Banner 消失、被隐藏、未渲染或高度为 `0` 均属于 **BUG / 回归**。
- 不得通过移动端媒体查询、内容变体、block class 或 JavaScript 条件隐藏整个 `home-banner`。响应式实现只能调整图片裁切、尺寸、文案、按钮和轮播控件。
- 如果 Figma、旧设计说明或参考复刻与本规则冲突，以本规则和 AEM Author 当前业务要求为准；不得据此实现“移动端隐藏 Banner”。
- 修改 Homepage、`home-banner`、全局响应式样式或内容模型后，必须至少在桌面端 `1920px` 和移动端 `390px` 验证 Banner 可见、图片成功加载、区块高度大于 `0`，且不存在 `.block-error`。
