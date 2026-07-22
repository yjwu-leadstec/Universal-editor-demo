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

## 组件样式隔离强制规则

- 组件内具有专属视觉或交互行为的控件必须使用 block 专属 class（例如 `.feature-media-tab`），不得只依赖全局 `button`、`a` 或通用工具类选择器。
- 当组件设计与全局控件规则不同，应在 block CSS 中显式重置会冲突的属性，例如 `appearance`、`background`、`border`、`border-radius`、`margin`、`padding`、`max-width`、`overflow` 和 `text-overflow`；不得为了单个组件修改全局控件规则。
- 如果通用逻辑不能完整满足组件设计，应为该组件保留独立实现。不得为了代码复用强行合并行为，导致不同组件的布局、状态、动效或伪元素互相覆盖。
- 使用定位在控件边界外的伪元素时，必须同时验证祖先和控件本身的裁切规则。状态指示线等连续视觉应由正确的共享容器绘制，激活态只负责覆盖自己的状态段。
- 修改组件控件样式后，至少验证默认态、激活态、键盘焦点态和响应式变体，并为关键隔离规则增加回归测试。

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

## Language Copy、Live Copy 与新增站点强制规则

- **Language Copy 是语言母版，不是国家站。** 新语言先通过 AEM Sites 的 Create Language Copy 在 `/content/demo-site/language-master/<language>` 建立或更新翻译源；不得把市场目录当作翻译母版，也不得用普通 Copy/Paste 代替 Language Copy。
- **Live Copy 是市场交付站。** 已批准市场应从 Blueprint `/content/demo-site/language-master` 通过 AEM MSM Create Site / Create Live Copy 建到同层市场根，例如 `/content/demo-site/ae/ar`；不得把 `global`、`central-asia` 或市场站点放到 `language-master` 下。
- **新增国家站点顺序：** 批准市场与语言矩阵 → 确认所需语言母版已存在 → 配置/复用 Blueprint 与受控 rollout → Create Site 选择初始语言 → 验证 `homepage`、`nav`、`footer`、内部链接、继承状态、Canonical/hreflang → 更新 `/en/locale-directory`，保持 `enabled=false` → Preview 验收后启用并发布。
- **现有国家新增语言顺序：** 若母版语言不存在，先建 Language Copy；再从 Blueprint 向现有市场根添加该语言的 Live Copy。不得在市场根下手工新建一套无 Live Relationship 的页面树。
- Header/Footer/locale-directory 是每个语言根下的普通 AEM 页面，必须随语言母版和 Live Copy 一起创建、rollout、验证和发布。结构化 `Header Navigation` 子项会作为组件子资源参与 rollout；市场法务或本地链接需要 override 时，必须有明确的继承取消记录。
- EDS 代码只负责按 `/{market}/{language}` 解析本地 `nav`、`footer` 和链接；它**不会**创建 Language Copy、Blueprint、Live Copy，不会执行 rollout，也不会自动发布。AEM Sites/MSM 配置与发布属于 Author/Admin 操作。
- 优先使用 Blueprint Configuration 和人工受控 rollout；未经专门评审不得启用 `onModify` 自动 rollout，也不得把 Activate/Publish 串入 rollout。上线前必须检查 Live Copy Overview、继承状态和内部链接是否指向目标市场语言根。
- 详细设计与未完成环境任务见 `openspec/changes/refactor-localized-site-shell/`。其中 Blueprint、`/global/en` Live Copy、rollout 与链接重写验证未完成时，不得声称“新增站点/新增语言已经自动化”。

## Homepage Banner 强制规则

- Homepage 的 `home-banner` 默认在桌面端、平板端和移动端显示；`showOnSmallScreens` 缺失或为 `true` 时，小屏 Banner 消失、未渲染或高度为 `0` 均属于 **BUG / 回归**。
- 只有 Author 在 Home Banner dialog 中明确关闭 `Show on Small Screens` 时，才允许在 `<720px` 隐藏整个 `home-banner`；中屏和大屏必须继续显示。不得通过其他内容变体、任意 block class 或无关 JavaScript 条件隐藏 Banner。
- 如果 Figma、旧设计说明或参考复刻与本规则冲突，以本规则和 AEM Author 当前业务要求为准；不得据此实现“移动端隐藏 Banner”。
- 修改 Homepage、`home-banner`、全局响应式样式或内容模型后，必须至少验证桌面端 `1920px` 始终可见；移动端 `390px` 在 `showOnSmallScreens=true` 时可见且高度大于 `0`、在 `false` 时隐藏，并确认不存在 `.block-error`。

## Header 响应式强制规则

- 全站布局仍是三档：`1441px+` 大屏、`720-1440px` 中屏、`719px-` 小屏；Header 另有组件级 `1000px` 行为断点，不得把它解释为第四套全站布局。
- `>=1000px` 使用桌面导航；首页顶部透明态使用渐变和 `20px` 背景模糊。
- `<1000px` 使用汉堡导航；首页顶部必须完全透明，不得保留渐变或 `backdrop-filter`。
- 首页透明 Header 在所有尺寸下都覆盖首个组件；滚动、打开导航/面板/语言弹窗时切换为白底、无模糊和深色前景。
- 修改 Header 时必须同时校验 CSS 媒体查询与 JavaScript `matchMedia` ，并至少验证 `999px` / `1000px` 边界、`390px` 小屏和 `1024px` 中屏。
