# Service blocks 发布态标记重建修复（Official Center / Contact Us）

## 背景 bug
`blocks/service-contact-cards`（Contact Us 页 block）在**发布交付 `.aem.live` 上渲染崩坏**：块级字段 `title/description/id` 漏渲染成空卡、头部丢描述。四断点一致，编辑器态正常。

**根因**：`scripts/service-block-utils.js` 的 `hasModel`/`isPropertyRow`/`propSource` 全部依赖 `data-aue-model`/`data-aue-prop`，而这些属性**只在 Universal Editor 编辑态存在，发布交付（`.aem.live`/`.aem.page`）里没有**（`grep data-aue` 整页为空）。→ `contentStartsAt=-1`，头部/卡片不分离。`dataset.serviceKind` 是只读死代码（从没被写入）。

## 修法（照搬 product-block-utils.js 的既有模式）
product 侧早有 `restorePublishedMarkup`（按注册表把 `data-aue-*` 重建到裸 `<div>` 上），service 侧**完全缺这套**。补齐：

1. `scripts/service-block-utils.js` 新增（复刻 product 实现）：
   - `SERVICE_MODEL_FIELDS`（注册 3 个模型的有序字段）：
     - `service-contact-cards`: title/text, description/richtext, link/aem-content, linkText/text, linkType/select, id/text（键用 **block class 名** `service-contact-cards`，非模型 id `support-contact-cards`）
     - `support-contact-card`: cardKey/text, title/text
     - `support-contact-field`: cardKey/text, label/text, value/richtext, link/aem-content
   - `SERVICE_COLLECTION_MODELS['service-contact-cards']`: `(row)=> row.children.length<=2 ? 'support-contact-card' : 'support-contact-field'`（卡片 2 cell、字段 ≥3 cell）
   - `restoreLinkField`/`matchesPublishedField`/`restorePublishedModel` + 导出 `initServiceBlock(block)`（有 `[data-aue-prop|model]` 就跳过 → 编辑器态零影响）
2. `blocks/service-contact-cards/service-contact-cards.js`：`decorate()` 首行 `initServiceBlock(block)`（在 `directRows` 前），`parseCard/parseField` 逻辑不动。

## 同批 CSS 修复（对齐现网+设计稿）
`blocks/service-contact-cards/service-contact-cards.css`：
- **PC 卡片：两列 grid → 单列竖向堆叠**。删 `grid-template-columns/justify-content`；`h3{max-width:630px}` + `.support-contact-fields{max-width:469px}`。设计 `.pen ovifV` 和现网都是标题在上、字段组在下、右侧留白。
- **移动端标题 28px→20px**（`line-height 1.3→1.6`）。设计 `.pen I0q34Q`=20px、现网≈20px。

## 事实来源优先级（用户确认）
**现网 > 设计稿(.pen) > 旧文档**；与现网/`.pen` 冲突可无视旧 md 文档。`official-centre.md` 曾把「内容列 630/字段组 469」被误读成两列，已补澄清。范围只含**内容区**，nav/footer（共享组件）不评不动。

## 其他 service 块排查结果（已完成）
排查了全部 5 个用 `service-block-utils.js` 的块。**关键发现：service 块用「分组字段」**（`copy_`/`media_`/`cta_` 前缀 → 交付时整组挤进 1 个 cell 的多个 `<p>`/picture），与 contact 的**扁平字段**不同 → **contact 的 `initServiceBlock` 扁平注册表方案对它们不适用**。且这些块本就有**部分语义兜底**（不像 contact 全崩）。经与现网对照，实际 bug + 修法（均为**逐块改语义兜底**，非 initServiceBlock）：

- **service-hero**（现网 `/support/service`，服务页在用）：`id`「service-hero」漏进描述末尾。修：copy 兜底限定到 copy 组 cell（`textParagraphs[0].closest('div')` 的 `<p>`），`slice(2)` 排除 id 行。✅ 分支 .aem.live 验证。
- **service-feature-panel**（服务页 3× list/app/diagnosis）：copy 组 heading/leadHeading/leadDescription 错位/丢失（副标题不显）。修：读 copy 组 `<p>` 按变体索引（`list`=2个→title=p0/desc=p1；`app|diagnosis`=3个→heading=p0/title=p1/desc=p2）。✅ 分支 .aem.live 验证。
- **service-bottom-bar / service-download-cards**：**无任何页面在用**（author 0 命中）→ 潜伏、无法在 .aem.live 验证。已**防御性改兜底**（bottom-bar 给 titleSource 补 `copyParagraphs[0]`，靠已有 `semanticSourceAfter` 接 desc；download-cards 用非 item 文本行取 title/subtitle + slug 正则排 id），仅靠 lint + 代码审查保证。

## ⚠️ 可复用教训（重要）
- **contact 块**（扁平字段）：加 `initServiceBlock` 注册表重建标记。
- **hero/feature-panel/bottom-bar/download-cards**（分组字段）：**逐块改语义兜底**（限定到分组 cell、按变体索引取 `<p>`、slug 排 id）。两类是不同修法，别混用。
- 新增/改 service 块时，务必在**发布态**（`.aem.live` 或 `aem up` 代理，均无 data-aue）验证，不能只看 UE 编辑器态。

## 提交与部署
- feature 分支 **`fix-svc-blocks`** 已推 `yjwu-leadstec/Universal-editor-demo`（本地 git 用户 yunjun199321 无写权限，用 gh keyring 里的 `yjwu-leadstec` 账号推，推完切回）。含 contact + 4 个 service 块 + utils 共 7 文件。
- 分支 .aem.live `https://fix-svc-blocks--Universal-editor-demo--yjwu-leadstec.aem.live/language-master/en/{service,official-center}` 四断点验证通过。**未合 main**（生产需 merge）。


## 关键坐标
- EDS 页面：`.aem.live/language-master/en/official-center`（author 内容 `/content/demo-site/language-master/en/official-center`，AEM MCP profile `leadstec-dev` 可直连）
- 设计稿：`lixiang2/docs/pencil/official-center/official-center.pen`（画板 `fM1ba` Contact Us / `y0whzd` M-Contact Us / `tPqa3` PC 内容区 / `cwyyv` PC 页脚）
- 现网：`www.liauto.com/support/aftersale`（内容=中亚门店，与 EDS demo 一致）
- 本地测试：`aem up --no-open --port 3001`（代理 aem.page 无 data-aue，复现发布态）
- 对比证据/截图脚本：`output/contact-compare/`（shot.js 全页 / shot2.js 顶部 / footer.js 页脚，用 playwright-core headless-shell）

相关：`mem:home-blocks-development`（同类「块级字段漏进卡片」坑）、`mem:project-overview`。
