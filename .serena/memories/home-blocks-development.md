# 首页 EDS Blocks（homepage）

依据 `lixiang2/eds-reference`（像素级参考）+ `docs/*/home-blocks.md`/`homepage.md`，在 `Universal-editor-demo/blocks/` 开发的 4 个可部署首页 block（UE dialog + 完整动效），已在 **leadstec-dev author 真实环境**编排内容并端到端验证。

| block | 参考 section | 关键动效 | 移动端开关 |
| --- | --- | --- | --- |
| `home-vehicle-grid` | 车型网格 SceneMultiGrid | 4×2 网格，large 跨2列；hover 图放大10%+黑遮罩+副标题上移+双CTA(硬编码 Learn More/Order Now)；kind=charging 变体 | `classes: hide-large-mobile` 隐藏大卡 |
| `home-banner` | 主视觉 SceneMultiBanner | 首尾克隆无缝循环，5s 自动轮播，hover 暂停，指示器，图 hover 放大5% | `classes: hide-mobile` 隐藏整块 |
| `home-carousel` | 品牌故事+技术横滑（story/tech 共用 renderHomeHorizontal）| coverflow 中心卡全宽+相邻60%透明，箭头/指示器，story 视频卡仅居中播放+poster兜底+Replay | variant `classes: story\|tech` |
| `home-product-list` | 产品展示 product-home-produce-list | 双图方形面板，hover 放大，进视口淡入 | — |

## 设计决策
- story(`home-feature-cards`) 与 tech(`technology-explore-section`) 共用 renderHomeHorizontal → 合并为单一 `home-carousel` + variant。
- `home-share-meta` = 页面 metadata，不做可见 block。
- 全宽 block：`width:100vw;margin-left:calc(50% - 50vw)`。
- 移动端可选「复刻首页流」（隐藏大卡+banner，因 banner 承接 hero）；默认全显示保通用。

## ⚠️ EDS 真实交付结构（踩坑要点，务必遵守）
1. **字段折叠**：`image`+`imageAlt` 渲染成**一个 cell**（alt 落 img 属性，无独立 alt cell）；`link`+`linkText` 折叠成一个 `<a>`（文案是 anchor.textContent）。保留后缀 `Alt/Text/Title/Type/MimeType` 必须有基字段，否则 `xwalk/no-orphan-collapsible-fields` 报错。
2. **块级字段各自成行**：block 的每个内容字段（`id`、carousel 的 eyebrow/heading/mobileHeading）渲染成**独立单 cell 行**排在子项前；`classes`→block class（非 cell），空字段仍占行。
3. **取值必须按类型查询**（非索引）：`pictures[0]=主图, pictures[1]=logo`，`anchor`=link，`.mp4`=video；**有图行=item，无图行=块级字段（按模型顺序）**。索引法在可选字段缺省/折叠时错位。
4. **item 节点 `name` 属性是组件显示名（保留）**，勿用 `name` 做字段（用 `vehicleName`）。
5. **多 picture 歧义**：可选 `mobileImage` 会破坏 pictures 位置判断 → 已移除（单图 object-fit 兜两端）。
6. **CI 跑 `eslint . --ext .json` 校验合并后根 models**（xwalk）；本地只 lint block 目录会漏。`xwalk/max-cells` 默认 4，超了在 `.eslintrc` 加 override（已加 vehicle-tile:8/banner-slide:6/carousel-card:6/home-carousel:6）。

## 通用约定
- lit-html + `moveInstrumentation`（真实交付 `data-aue-*` 已验证保留，UE 可编辑）。
- 模型 `blocks/<name>/_<name>.json` 三段 {definitions,models,filters}，`npm run build:json` glob 合并（husky pre-commit）。block class = `model`（kebab），非节点名。
- CSS lint：类名禁 BEM 双横线（单横线）；reveal/hover 顺序冲突用 `stylelint-disable no-descending-specificity`。

## 真实环境验证（leadstec-dev）
- author `author-p80707-e1685574`；EDS 内容 JCR：`page/jcr:content/root/section/<block>(resourceType block)/<item>(block/item)`，reference 字段存 DAM 路径（复用 `/content/dam/li-demo/` 车型图）。
- 测试页 `/content/demo-site/home-blocks-test`（已编排全部 4 block）。
- **`.aem.page` preview 需 admin.hlx.page 鉴权（401，站点受保护），无法程序化触发**——需 Sidekick/UE 点 Preview。
- 验证法：JWT Service Credentials 换 author token → 取 `bin/franklin.delivery/.../home-blocks-test.html` 真实交付 HTML + 下载 DAM 图 → 本地套 block 渲染截图。四断点无溢出、0 error、DOM 正确。
- 修复的真 bug（只在真实交付暴露）：折叠 cell 取值、块级字段成行漏进卡片、tech 移动端 copy `top:60px` 未重置被裁切。

相关：`mem:project-overview`。
