# L6 Sky Blue Feature Media 对齐验收

## 事实来源

- Pencil：`Li-L6.pen` 中 `PC-L6 / T&P 1`
- 官网：`https://www.liauto.com/l6` 的 `New Color, Sky Blue.` 区块
- 实际测试内容：`/content/demo-site/language-master/en/li-l6/jcr:content/root/section/block-04-feature-media-section`

## 内容与组件数量

- 区块标题：`New Color, Sky Blue.`
- 区块说明：`The special color for L6-Sky Blue, fresh, timeless, and effortlessly versatile. It captivates at first glance and looks stunning in photos.`
- 必须包含两个 `feature-media-item`：`Black & White` 与 `Black & Brown`。
- 每个媒体项分别配置图片、标签和说明；内容为空时不渲染对应文案。

## PC / 中屏

- Pencil 1920 基准：标题内容宽 840px，左边距 384px；主图 1480×832px，水平居中。
- 标题 46px / 62px，说明 16px / 24px；标题与说明间距 16px。
- 标题区上方 160px；标题区到媒体 64px。
- 图片下方使用两个居中的标签按钮；当前标签有 2px 指示条。
- 标签下展示当前媒体项说明；标签切换同步更新图片与说明。
- 720–1440px 按 1920 基准等比缩放，但正文最小保持可读字号。

## M 端（<720px）

- 标题左右 40px；标题 24px / 33.6px，说明 14px / 22px。
- 图片容器左右 16px，单项宽度为视口减 32px；图片在卡片内左右 4px，比例约 335:197。
- 两张媒体项在同一水平滚动轨道中，使用原生手势手动横滑并吸附；不自动轮播。
- 当前卡片说明与标签列表位于图片下方；标签状态随横滑位置同步。
- 组件不得产生页面级横向滚动。

## Dialog 结论

现有模型已经覆盖本区块需要的标题、移动端标题、主题/间距、自动播放、媒体、移动端媒体、标签、说明和视频控制字段。本次不新增字段；仅调整标签文案和默认自动播放行为的使用方式：PC 可按配置切换，M 端始终手动横滑。

## 回归标准

- 390px、765px、1440px 下均无 `.block-error`、控制台错误或页面横向溢出。
- PC 首屏只显示一个媒体面板，切换时不存在两张图片同时露出或错位。
- M 端可拖动到第二项，吸附后标签与说明同步更新。
- Universal Editor instrumentation 保留在区块字段和两个媒体项上。
