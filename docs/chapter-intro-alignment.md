# L6 Chapter Intro 官网对齐验收

## 事实来源

- 官网：`https://www.liauto.com/l6` 的 `Exterior Design` 章节首屏。
- 实际测试内容：`/content/demo-site/language-master/en/li-l6/jcr:content/root/section/block-03-chapter-intro`。

## 内容结构

- Eyebrow：`Exterior Design`。
- Title：`Exquisite, Dynamic and Youthful.`。
- 两段内容必须使用现有独立字段，不把 Eyebrow 合并进 Title；Dialog 无需新增字段。
- 旧预览内容若仍保留合并标题，运行时只对 `design` 锚点做兼容拆分；Author 新内容继续以独立字段为准。

## 响应式基准

- 1441px 以上：Copy 左侧为画面宽度的 `20%`，宽 `600px`，距底 `160px`；Eyebrow `20/32px`，Title `46/62px`。
- 1025–1440px：Copy 宽 `450px`，距底 `120px`；Eyebrow `15/24px`，Title `34.5/46.5px`。
- 720–1024px：Copy 宽 `44.6429vw`，距底 `11.9048vw`；字号按官网比例连续缩放。
- 719px 以下：画面保持全屏高度，Copy 左右 `40px`、距底 `160px`；Eyebrow `14/22px`，Title `24/36px`。
- Eyebrow 使用 `licium-regular`，Title 使用 `licium-medium`，均为 `400` 字重和白色文字。

## 回归标准

- 背景图/视频保持 16:9 桌面构图和移动端全屏构图。
- 390px、800px、1025px、1440px 不产生页面级横向滚动或 `.block-error`。
- 视频播放按钮、进度环及 Universal Editor 字段 instrumentation 不变。
