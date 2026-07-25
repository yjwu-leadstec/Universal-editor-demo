# propSource 作用域陷阱（product-block-utils.js）

## 问题
`propSource(root, name)` 原本用未限定作用域的 `root.querySelector('[data-aue-prop=NAME]')`，
会**穿透到嵌套的子 item 中**。

当父模型**没有**某字段、而子 item **有**该字段时：
1. `createSectionHeader(block)` 在 block 上找 `eyebrow`/`title`/`mobileTitle`/`description`
2. querySelector 命中**第一个子 item** 的同名字段
3. `instrumentProp` → `moveInstrumentation` 会**搬走** `data-aue-prop`
4. 结果：该字段被错渲染进 section header，且**第一个子项在 Universal Editor 中失去可编辑性**

## 修复
在 `propSource` 中检查命中节点的归属：若它属于 `root` 内部的另一个 `[data-aue-model]`，返回 null。

## 受影响的 5 个 block（父缺字段 + 子有字段）
- lixiang-product-intro-slider → highlight-slide（eyebrow）
- lixiang-product-intro-highlight-group → lixiang-product-intro-highlight（description）
- feature-grid-group → feature-grid-item（description）
- product-feature-picture-group-group → product-feature-picture-group-card（description）
- product-guide → product-guide-item（description）

## 新增 block 时的检查
父子模型字段名重叠时务必验证：父模型缺少的字段不会被子项"顶替"。
相关：`mem:project-overview`
