# Project Context

## Purpose
AEM Edge Delivery Services (EDS) 项目，配置了 Universal Editor 支持，为 Franklin blocks 提供可视化编辑能力。内容来源于 AEM Cloud Service author 实例，通过 Edge Delivery 分发。

## Tech Stack
- **JavaScript (ES Modules)** - 原生 ES6+ 模块系统
- **lit-html** - 轻量级模板库，用于 block 渲染
- **AEM CLI** - `@adobe/aem-cli` 本地开发服务器
- **ESLint** - 代码质量检查 (airbnb-base + xwalk plugin)
- **Stylelint** - CSS 代码规范检查
- **Husky** - Git hooks 管理

## Project Conventions

### Code Style
- ESLint 配置: `airbnb-base` + `plugin:xwalk/recommended`
- 导入语句必须包含 `.js` 扩展名
- Unix 换行符 (LF)
- 允许修改函数参数的属性 (`no-param-reassign` props: false)
- CSS 遵循 `stylelint-config-standard`

### Architecture Patterns

#### Block 系统
每个 block 位于 `/blocks/[name]/` 目录：
- `[name].js` - 主 `decorate(block)` 函数
- `[name].css` - Block 样式
- `_[name].json` - Universal Editor 模型定义（可选）

#### lit-html 集成
```javascript
import { html, render, nothing, createRef, ref } from '../../scripts/lit.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];
  const fieldRef = createRef();

  block.textContent = '';
  render(html`<div class="my-block">...</div>`, block);

  // 迁移 Universal Editor instrumentation
  moveInstrumentation(sourceRow, fieldRef.value);
}
```

#### 脚本加载阶段
- **Eager** (`loadEager`): 首屏关键内容
- **Lazy** (`loadLazy`): 首屏下方内容和 blocks
- **Delayed** (`loadDelayed`): Analytics 和非关键功能

### Testing Strategy
目前项目未配置自动化测试框架。建议添加：
- E2E 测试 (Playwright) 验证 block 渲染
- 单元测试验证数据处理逻辑

### Git Workflow
- 主分支: `main`
- Husky 管理 Git hooks
- 提交前运行 `prepare` script

## Domain Context

### Universal Editor Instrumentation
`moveInstrumentation(source, target)` 函数将 `data-aue-*` 属性从内容行迁移到装饰后的元素，启用上下文编辑。

### Component Model 系统
- 源模型在 `/models/_*.json` 定义字段类型
- `npm run build:json` 合并到根目录 JSON 文件：
  - `component-models.json` - 字段定义
  - `component-definition.json` - UI 配置
  - `component-filters.json` - 放置规则

### 现有 Blocks
- `avatar` - 用户头像
- `cards` - 卡片列表
- `columns` - 多列布局
- `footer` - 页脚
- `fragment` - 内容片段
- `header` - 页头
- `hero` - Hero 横幅
- `product-table` - 产品表格
- `quote` - 引用块

## Important Constraints
- Node.js 18.3.x 或更高版本
- 必须使用 AEM CLI 进行本地开发
- 内容来自 AEM Cloud Service author 实例
- Block JS/CSS 文件名必须与目录名匹配

## External Dependencies
- **AEM Cloud Service**: `author-p80707-e1685574.adobeaemcloud.com`
- **Edge Delivery CDN**:
  - Preview: `https://main--{repo}--{owner}.aem.page/`
  - Live: `https://main--{repo}--{owner}.aem.live/`
