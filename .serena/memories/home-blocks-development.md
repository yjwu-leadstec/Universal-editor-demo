# 首页 EDS Blocks（homepage）

依据 `lixiang2/eds-reference`（像素级参考实现）+ `docs/*/home-blocks.md`/`homepage.md` 规范，在 `Universal-editor-demo/blocks/` 开发的 4 个可部署首页 block（含 UE dialog + 完整动效）：

| block | 对应参考 section | 关键动效 |
| --- | --- | --- |
| `home-vehicle-grid` | 车型网格 SceneMultiGrid | 4×2 网格，large 跨2列；hover 图放大10%+黑遮罩+副标题上移+双CTA(Learn More/Order Now)显现；tile kind=charging 变体 |
| `home-banner` | 主视觉 SceneMultiBanner | 首尾克隆无缝循环，5s 自动轮播，hover 暂停，指示器，图 hover 放大5% |
| `home-carousel` | 品牌故事+技术横滑（renderHomeHorizontal，story/tech 共用）| coverflow：中心卡全宽+相邻60%透明，箭头/指示器，story 视频卡仅居中播放+poster兜底+Replay；variant 用 `classes` 字段 story\|tech |
| `home-product-list` | 产品展示 product-home-produce-list | 双图方形面板，hover 图放大，进视口淡入上移 |

## 设计决策
- reference 中 story(`home-feature-cards`) 与 tech(`technology-explore-section`) 共用 `renderHomeHorizontal`，故合并为单一 `home-carousel` + variant，而非两个 block。
- `home-share-meta` 是页面 metadata，不做可见 block。
- 全宽 block 用 `width:100vw;margin-left:calc(50% - 50vw)` 突破 section max-width。

## 模式约定
- lit-html + `moveInstrumentation`；块级内容字段（如 carousel 标题行）= 无图行，卡片项 = 有图行（启发式区分）。
- 模型 `blocks/<name>/_<name>.json` 三段 {definitions,models,filters}，`npm run build:json` 自动 glob 合并（husky pre-commit）。
- 反 CSS lint：类名禁 BEM 双横线（用单横线）；reveal/hover 顺序冲突用 `stylelint-disable no-descending-specificity`（项目 avatar.css 先例）。

## 验证
四断点 1920/1440/1024/390 无横向溢出、0 console 错误；DOM 计数正确（7车型卡/3banner+2克隆/story3视频卡/tech4卡/2产品面板）。lint(js+css+json) 全绿。相关：`mem:project-overview`。
