# Avatar Block（现役设计 + 三个已修根因）

## 现役设计：单头像居中，**无 grid 模式**
`blocks/avatar/avatar.css` 用 `flex` 居中，**没有 grid 布局、没有 `.single` 变体**（曾加过 grid，后被推翻移除）。多头像场景请用 Cards 组件，不要给 Avatar 加回 grid。

尺寸变体：Small 64px / Medium 128px（默认）/ Large 256px。响应式：≤768px 时 Large→200px；≤480px 时 Large→150px、Medium→100px。

## 三个踩过的坑（根因，勿重犯）

1. **尺寸变体失效**：`avatar.js` 原先读 `block.classList.contains('small')`，但 **Universal Editor 是把 size 作为 data 字段放在 row 里传，不是 CSS class**。修法：遍历 rows 取 size 值（small/medium/large）再加 class。
   → 通用教训：UE 的 select 字段值走 row cell，不走 block class（`classes` 字段除外，那个才映射成 block class）。

2. **放进 columns 后不圆了**：`columns.css` 有 `.columns img { width: 100% }`，覆盖了头像的固定宽高。修法：在 `avatar.css` 末尾加 `.columns .avatar-image-wrapper` 等更具体选择器重申固定尺寸。

3. **放进 columns 后居中失效**：columns 用 `display:flex` + `flex:1`，且通用选择器 `.columns > div > div` 影响所有子元素，压过 avatar 的居中。修法：用 `.columns .block.avatar { width:100%; margin:0 }` 等作用域化规则。

→ 通用教训：**block 被嵌进 columns 时，务必检查 `columns.css` 的通用选择器是否覆盖了本 block 的布局/尺寸**，需要更高特异性的作用域规则兜住。

相关：`mem:project-overview`。
