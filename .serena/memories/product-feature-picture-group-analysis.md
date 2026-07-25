# product-feature-picture-group 组件分析结论

## 组件位置
- `blocks/product-feature-picture-group/` (JS/CSS/_*.json)
- 共享 utils: `scripts/product-block-utils.js` (PRODUCT_MODEL_FIELDS line 82-84, PRODUCT_COLLECTION_MODELS line 125)
- 根配置: component-models.json / component-definition.json / component-filters.json (husky pre-commit 自动 build:json)

## 已识别问题（2026-07-25 /sc:analyze + /sc:brainstorm 多轮校验）

### 🔴 C1 高 - 混合 groups+直接 cards 时直接 cards 被静默丢弃
- JS `decorate()` 用 `if(groups.length)...else...` 互斥分支 (product-feature-picture-group.js:67-76)
- 顶级 filter 同时允许 group 和 card
- 系统性缺陷，feature-grid 共有
- 修复：if 分支末尾追加 `modelItems(block,'...-card')` 查询

### 🔴 C2 高 - 发布 HTML 启发式误判
- product-block-utils.js:125 `row.children.length<=2 ? group : card`
- 仅在发布 HTML 触发（restorePublishedMarkup line 197-201 无 data-aue 时才跑，UE 编辑态不触发）
- 2 单元格卡片(title+description)被误判为 group，渲染内容错位（title->groupKey, description->group.title）
- 1 单元格卡片通常被 line 182 `source.children.length>1` 守卫消费为父字段
- 对比 lixiang-product-detail-picture-group (line 115-119) 用 `querySelector('picture,img,video')||children>3` 更健壮
- 修复：启发式改用媒体存在性

### 🟡 H1 中 - light-copy/dark-copy 与背景冲突致不可见
- eyebrow (css:27-29) 和 title (product-blocks.css:71) 都用 var(--product-copy)
- light-copy(#fff)+白底 / dark-copy(#191919)+黑底 = 不可见
- .light 是 no-op（默认即白底），light-copy 单独即可触发
- eyebrow 覆盖特异性 (0,2,1) 与基础规则相等，源顺序决定，仅当页面上有更早产品块时生效（脆弱）
- 根因：作者选矛盾 Text Color+Background 组合
- 修复：dialog 互斥校验 或 eyebrow 改用独立 --product-accent

### 🟡 M4 中 - 标题层级
- group title 和 card title 都是 h3，嵌套时 card 应为 h4

### 🟢 低
- H2: gray 主题 placeholder 未主题化
- M1: groupKey 字段 dead config（JS 从不读取）
- M2: 移动端 padding 不一致（list 20px vs text 40px）
- M3: 移动端隐藏滚动条（a11y）

## 关键复用知识
- modelItems(root,model): 递归 querySelectorAll，无 data-aue 时回退 directRows (line 270-275)
- addBlockAnchor: 把所有 data-aue 属性合并到 aria-hidden anchor 标记
- createMedia: 处理 mobileImage (MOBILE_MEDIA_QUERY='(max-width: 719px)')
- 主题变量: --product-bg/--product-card-bg/--product-copy/--product-muted/--product-accent + .light/.dark/.gray/.light-copy/.dark-copy
