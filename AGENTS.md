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

## DAM 与 Dynamic Media 强制边界

- 本项目使用 AEM DAM 作为资产库，但**不把 Dynamic Media、Scene7、Smart Crop 或 `/adobe/dynamicmedia/` URL 作为运行依赖**。不得把手工 DM URL、`dm-aid` URL 或 Scene7 URL 写入页面字段、模型默认值或代码。
- 页面资产属性必须保存 `/content/dam/li-auto/...` 标准 DAM 引用；旧 `/content/dam/li-demo/...` 仅属迁移期遗留，不得用于新增或正式内容。`paths.json` 负责将 `/content/dam/li-auto/` 映射到 EDS `/assets/` 并包含该内容根。
- `/content/dam/li-auto` 必须绑定站点 EDS Cloud Configuration：`cq:conf=/conf/demo-site`。发布前应验证 DAM 资产、引用页面及此配置均进入 EDS Preview。
- `leadstec-dev` 是共享 Sandbox，可能因环境级 Dynamic Media 配置而在 Author HTML 中把普通 `reference` 字段临时渲染为 `/adobe/dynamicmedia/...`。这只是该环境的输出行为，不能据此改变项目架构；**不得把“Reprocess Assets 到 DM”当作项目修复或验收条件**。
- 无 DM 验收以 JCR 中的 `/content/dam/li-auto/...` 引用、`paths.json` 映射、EDS Preview `/assets/...` 可访问和页面图片成功加载为准。若 Sandbox 的全局 DM 设置妨碍 Author 预览，应由 AEM 管理员调整共享环境配置，不得在 block 中硬编码 UUID 到 DAM 路径的映射。

## AEM Author 内容路径

当前 EDS 项目的页面内容统一维护在 `/content/demo-site`，采用扁平独立站点根：

- Sites 控制台：[打开当前 EDS 内容目录](https://author-p80707-e1685574.adobeaemcloud.com/ui#/aem/sites.html/content/demo-site)
- 内容母版：`/content/demo-site/language-master/en`
- Global 管理站点：`/content/demo-site/global`
- Central Asia 管理站点：`/content/demo-site/central-asia`
- 对外站点：`/content/demo-site/en`、`ae`、`sa`、`nl`、`kw`、`kz`、`uz`
- 环境：`author-p80707-e1685574.adobeaemcloud.com`

管理关系不得编码成 JCR 父子层级：`global`、`central-asia` 和所有对外市场站点处于同一层。Global English 直接使用 `/en`；其他正式语言根为 `ae/{en,ar}`、`sa/ar`、`nl/nl`、`kw/en`、`kz/{kk,ru}`、`uz/{uz,ru}`。每个语言根下维护自己的 `homepage`、`nav`、`footer` 和业务页面；共享国家/语言目录维护在 `/en/locale-directory`。开发和回归测试仍默认使用 `/language-master/en/homepage`，不得自行增加 Germany、Bahrain 或其他未批准市场。

## Homepage Banner 强制规则

- Homepage 的 `home-banner` 是桌面端、平板端和移动端都必须显示的正式页面内容；移动端 Banner 消失、被隐藏、未渲染或高度为 `0` 均属于 **BUG / 回归**。
- 不得通过移动端媒体查询、内容变体、block class 或 JavaScript 条件隐藏整个 `home-banner`。响应式实现只能调整图片裁切、尺寸、文案、按钮和轮播控件。
- 如果 Figma、旧设计说明或参考复刻与本规则冲突，以本规则和 AEM Author 当前业务要求为准；不得据此实现“移动端隐藏 Banner”。
- 修改 Homepage、`home-banner`、全局响应式样式或内容模型后，必须至少在桌面端 `1920px` 和移动端 `390px` 验证 Banner 可见、图片成功加载、区块高度大于 `0`，且不存在 `.block-error`。

## Header 响应式强制规则

- 全站布局仍是三档：`1441px+` 大屏、`720-1440px` 中屏、`719px-` 小屏；Header 另有组件级 `1000px` 行为断点，不得把它解释为第四套全站布局。
- `>=1000px` 使用桌面导航；首页顶部透明态使用渐变和 `20px` 背景模糊。
- `<1000px` 使用汉堡导航；首页顶部必须完全透明，不得保留渐变或 `backdrop-filter`。
- 首页透明 Header 在所有尺寸下都覆盖首个组件；滚动、打开导航/面板/语言弹窗时切换为白底、无模糊和深色前景。
- 修改 Header 时必须同时校验 CSS 媒体查询与 JavaScript `matchMedia` ，并至少验证 `999px` / `1000px` 边界、`390px` 小屏和 `1024px` 中屏。
