# About Us 页面交付（2026-07-28 第二轮全断点比对完成）

About Us 页（`/content/demo-site/language-master/en/about-us`）已按现网 `www.liauto.com/about.html` 完成**自底向上 9 个 block × 5 断点（1920/1440/1024/768/390）逐块多轮比对**，数值（top/height/font-size/卡片尺寸）与视觉截图均与现网一致。**不要重新调研**——完整口径在 `docs/about-us-alignment.md`。

第二轮新增的关键现网规则（详见文档「断点」节）：
- Section header：h2 lh **1.5652**、文本列宽 `calc((100vw - 15px) * 0.6)`（≤1024 折 2 行）、间距 8px、pt 80/pb 56。
- **移动端 375 基准**：任意 ≤720 视口现网都按 375px 渲染并居中；hero/showcase 场景高 = `min(100vw,375px) * 2.25`（不随视口高度变）。
- 卡片定档高度（790/501.5、518/362、values 780/499/420，**860px 是 values 跳档点**），勿用 aspect-ratio。
- 图片裁切 = 整卡 cover（media absolute inset 0 + 不透明面板盖上）。
- 所有卡片区两档图：模型已加 `mobileImage`（design 用 `largeImage_mobileImage`、dual 用 `image_mobileImage` 并入 image 组）。
- 描述类文字桌面 licium-medium 必须命中 `p` 子元素（通用 p 规则会抢回 regular）；副标题全断点 regular。
- 视频显示高 = 16:9+8px；无播放按钮；CTA margin 需清零（全局 button 样式会漏 12px）。
- 卡片基类 `flex:1` 在移动纵向 grid 会压塌定高，移动档必须 `flex: none`。

内容侧修正（AEM JCR 已改并 Activate 过 preview）：creativity item-sales 桌面图 208969e4（错）→ a21c260c（门店）、item-supply → fcad80aa；creativity/dual/design 全部卡片与 values/hero 大图补齐 mobileImage（DAM 同名 UUID 资产）。

易踩的坑（沿用）：
- xwalk 模型最多 4 个字段组，多字段用 `prefix_` 并组；`name` 是保留属性不能作字段名。
- 修改 AEM 内容后必须 `POST /bin/replicate.json`（cmd=Activate, agent=preview）页面级激活。
- aem.page CSS `cache-control: max-age=60`，推送后立刻截图会拿旧 CSS——等待 ≥70s 或用 CDP `Network.setCacheDisabled`。
- 现网 fadebox/about-anim 会位移 +90/+25px，量测 top 前必须滚动触发并沉淀 ≥2s。
- leadstec-dev Sandbox 的 reference 字段在 Author HTML 渲染成 `/adobe/dynamicmedia/...`(404)，是环境问题，不要适配。

## 已迁移到 Stage（2026-07-30）

代码 + 内容 + 67 个 DAM 资产已全部迁移到 `LiAutoWebsiteStage`（commit `13f7afc`，`/content/li-auto/language-master/en/about-us`，preview/publish 均已验收）。**Stage 侧唯一差异：`lixiang-about-video` 的模型字段 `ctaText` → `ctaLabel`**（stage 的 xwalk 启用 `no-orphan-collapsible-fields`）——本仓库仍是 `ctaText`，向 stage 再移植 about 修复时三处（模型 JSON、block JS、`ABOUT_MODEL_FIELDS`）都要改名，内容同步时 JCR 键和 `modelFields` 也要改写。详见 `LiAutoWebsiteStage/docs/about-us-blocks.md`。
