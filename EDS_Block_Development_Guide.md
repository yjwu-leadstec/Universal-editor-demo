# Adobe EDS Block 开发最佳实践指南

本文档总结了关于 Adobe Edge Delivery Services (EDS) Block 开发模式的改进方案、安全性分析及工具选择建议。

## 1. 背景与痛点

Adobe EDS 传统的开发模式使用纯 JavaScript (`document.createElement`, `appendChild`) 来构建 HTML 结构。这种方式存在以下问题：

*   **可读性差**：大量的 DOM 操作代码让逻辑难以阅读。
*   **结构不直观**：无法一眼看出最终的 HTML 结构。
*   **维护困难**：修改 UI 需要深入理解 JS 逻辑。
*   **开发效率低**：简单的 UI 变更需要编写大量代码。

## 2. 改进方案分析

针对上述痛点，我们探讨了以下几种改进方案：

### 方案一：Template Literals (模板字符串) ⭐ 推荐用于无依赖场景

使用 ES6 模板字符串直接构建 HTML。

**优点**：
*   无需额外依赖。
*   无需构建工具。
*   代码可读性大幅提升。

**示例**：
```javascript
export default function decorate(block) {
  const data = extractData(block);
  block.innerHTML = `
    <div class="avatar-container ${data.sizeClass}">
      <div class="avatar-image-wrapper">
        ${data.picture?.outerHTML || ''}
      </div>
      <div class="avatar-info">
        <h3 class="avatar-name">${data.name}</h3>
      </div>
    </div>
  `;
}
```

### 方案二：lit-html ⭐ 推荐用于复杂场景

使用 Google 推出的轻量级模板库。

**优点**：
*   **安全**：自动转义动态值，防止 XSS。
*   **轻量**：仅 ~3KB。
*   **高效**：增量 DOM 更新。
*   **兼容性**：能很好地保留现有 DOM 节点（对 Universal Editor 至关重要）。

**示例**：
```javascript
import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html@3/+esm';

const template = html`
  <div class="avatar-container">
    <h3 class="avatar-name">${name}</h3>
  </div>
`;
render(template, block);
```

### 方案三：Handlebars.js (不推荐) ❌

虽然 Handlebars 是经典的模板引擎，但在 EDS 场景下**不推荐使用**。

**原因**：
1.  **体积大**：~22KB，远大于 lit-html。
2.  **破坏 Instrumentation**：Handlebars 生成纯字符串，使用 `innerHTML` 注入会完全重建 DOM，导致 Universal Editor 的 `data-aue-*` 属性丢失，从而破坏编辑功能。
3.  **灵活性差**：无法像 lit-html 那样保留现有的 DOM 引用。

## 3. 安全性考量 (XSS)

使用 `innerHTML` 或模板字符串时，必须注意跨站脚本攻击 (XSS) 风险。

*   **风险来源**：直接将未经处理的用户输入插入到 HTML 中。
*   **EDS 场景**：内容主要来自 AEM 或 Google Docs，通常在服务端已清洗，风险相对较低，但仍需谨慎。

**安全最佳实践**：
1.  **混合模式**：结构用模板字符串，文本内容用 `textContent` 设置。
2.  **使用 lit-html**：它会自动转义所有动态值，默认安全。
3.  **手动转义**：如果必须使用 `innerHTML`，编写 `escapeHtml` 函数处理变量。

## 4. 关键概念：moveInstrumentation

在重构 Block DOM 结构时，必须使用 `moveInstrumentation` 函数。

### 什么是 moveInstrumentation？
这是一个工具函数，用于将 Universal Editor 的特殊属性（`data-aue-*`）从一个元素迁移到另一个元素。

### 为什么要用它？
Universal Editor 依赖这些属性来识别页面上的可编辑区域。
*   当你使用 JS 重构 DOM（例如创建一个新的 `<div>` 包裹原有内容）时，原有元素上的 `data-aue-*` 属性可能会丢失或位置不对。
*   **必须**将这些属性迁移到新的对应元素上，否则在 Universal Editor 中将无法点击编辑该组件。

**lit-html 的优势**：
lit-html 允许你在渲染时保留对 DOM 节点的引用，从而可以方便地调用 `moveInstrumentation`，而字符串模板类库（如 Handlebars）通常很难做到这一点。

## 5. 本地集成 lit-html（推荐方式）

### 5.1 项目结构

```
scripts/
├── lit.js                    # lit-html 统一入口
├── lib/
│   └── lit-html/
│       ├── lit-html.js       # 核心库
│       ├── directive.js      # 指令基础
│       └── directives/       # 常用指令
│           ├── unsafe-html.js
│           ├── repeat.js
│           ├── class-map.js
│           └── style-map.js
```

### 5.2 在 Block 中使用

```javascript
import { html, render, nothing } from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const data = extractData(block);

  // 1. 渲染模板结构
  render(html`
    <div class="avatar-container ${data.sizeClass}">
      <div class="avatar-image-wrapper"></div>
      <div class="avatar-info">
        <h3 class="avatar-name"></h3>
      </div>
    </div>
  `, block);

  // 2. 应用 instrumentation（保持 Universal Editor 兼容）
  const nameEl = block.querySelector('.avatar-name');
  moveInstrumentation(data.nameRow, nameEl);
  nameEl.textContent = data.name;
}
```

### 5.3 可用的导出

| 导出 | 用途 |
|-----|-----|
| `html` | 创建 HTML 模板 |
| `render` | 渲染模板到 DOM |
| `nothing` | 条件渲染时表示"不渲染任何内容" |
| `noChange` | 表示值未改变，跳过更新 |
| `unsafeHTML` | 渲染原始 HTML（谨慎使用） |
| `repeat` | 高效渲染列表 |
| `classMap` | 条件性添加 CSS 类 |
| `styleMap` | 条件性添加内联样式 |

### 5.4 示例：条件渲染与列表

```javascript
import { html, render, nothing, repeat, classMap } from '../../scripts/lit.js';

const template = html`
  <ul class=${classMap({ 'has-items': items.length > 0 })}>
    ${items.length > 0
      ? repeat(items, (item) => item.id, (item) => html`
          <li>${item.name}</li>
        `)
      : html`<li class="empty">No items</li>`
    }
  </ul>
`;
```

## 6. 总结建议

1.  **首选方案**：**lit-html**
    *   兼顾了开发体验、安全性、性能和 Universal Editor 兼容性。
2.  **轻量方案**：**Template Literals + 混合写法**
    *   如果不希望引入任何第三方库，使用模板字符串构建结构，配合 `textContent` 和 `appendChild` 处理动态内容和现有节点。
3.  **避免使用**：**Handlebars** 或其他纯字符串模板引擎，因为它们难以保留编辑器的 Instrumentation 数据。
