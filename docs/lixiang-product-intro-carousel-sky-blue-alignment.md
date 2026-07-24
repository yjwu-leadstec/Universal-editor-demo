# L6 Sky Blue Product Intro Carousel 对齐验收

## 事实来源

- Pencil：`Li-L6.pen` 的 `3 / 内容展示`，PC 节点 `xyTDo` / `ANbVI`，移动节点 `GmQsG` / `XOng2` / `C58gGn` / `KNptl`，需求节点 `BqsC4`。
- 真实内容：L6 `SceneMegaContentTableX` 数据与当前 EDS Preview 的 `New Color, Sky Blue.` 区块。
- 规范 block：`lixiang-product-intro-carousel`。
- 迁移期线上节点仍可能名为 `feature-media-section`；旧入口只负责调用规范实现，不再提供作者模型。

## 内容结构

- 段头支持 Eyebrow、PC/M 独立标题、说明和可选视频链接；空字段不保留占位。
- 媒体子项使用 `lixiang-product-intro-slide`。Sky Blue 必须包含 `Black & White` 与 `Black & Brown` 两项。
- `topList` 使用 `lixiang-product-intro-highlight-group` → `lixiang-product-intro-highlight` 两层模型，不能扁平化跨组重排。
- `bottomList` 使用独立的 `lixiang-product-intro-metric`，3–4 项时作为主媒体的附着底栏；该数量规则不限制 Tab 数量。
- `smallImg` 在真实语料中为 0/101，不作为本组件必需字段。

## PC / 中屏

- 1920px 基准主媒体为 `1480 × 832px`；所有断点都按所选 `16:9 / 2.35:1 / 4:3` 比例计算，不使用固定高度覆盖比例。
- Tab 为内容宽度，最小 `98px`；长标签可扩展，激活指示线跟随实际 Tab 宽度。
- 浅色和深色主题分别使用 `--product-copy`、`--product-muted` 与主题分隔线，不能硬编码浅色主题的 `#191919 / #8c8c8c`。
- `space-large / space-small / space-none` 在 PC 分别为 `160 / 80 / 0px`，不得在 1440、1024 或 768px 合并成同一数值。
- PC/Tablet 可按配置每 4 秒自动切换；悬停、焦点进入、页面隐藏或 `prefers-reduced-motion` 时暂停。

## M 端（<720px）

- `space-large / space-small / space-none` 分别为 `80 / 60 / 0px`。
- 标题左右 `40px`；主媒体轨道左右 `16px`，卡片内边距 `4px`，375px 视口下媒体约为 `335 × 188px`（16:9）。
- 多项媒体使用原生水平滑动与吸附，不自动轮播；说明和纵向 Tab 随当前项同步。
- 附着指标条与媒体左右边缘对齐，不产生页面级横向滚动。

## 变体边界

- 保留真实源类型使用的 `default`、`overview`、`three-up`、`image-grid`、`expandable`、`primary-metric`、`stat`。
- `overlay-tabs` 没有来源矩阵或页面用例，不出现在 Universal Editor；旧内容值仅按 `default` 兼容。

## 回归标准

- 1920、1440、1024、768、390px 均无 `.block-error`、控制台错误或页面级横向溢出。
- 比例、主题、三档间距、单项/多项、Top highlight group、Bottom metric strip 均有独立回归。
- 同页多个实例的 Tab、Panel、Copy ARIA ID 不重复，键盘方向键/Home/End 可操作。
- Universal Editor instrumentation 保留在段字段、Slide、Highlight Group、Highlight 和 Bottom Metric 上。
