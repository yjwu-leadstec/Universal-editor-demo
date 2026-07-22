# Design: Localized Header, Footer, and Locale Directory

## 1. System Overview

本方案把“页面属于哪个市场/语言”作为站点 shell 的唯一上下文。header、footer 和地区/语言目录始终从当前语言根加载；语言母版负责可复用源内容，市场语言分支负责实际预览和发布。

```text
/content/demo-site
├── language-master
│   ├── en
│   │   ├── nav
│   │   ├── footer
│   │   ├── locale-directory
│   │   └── ...business pages
│   ├── ru
│   │   ├── nav
│   │   ├── footer
│   │   ├── locale-directory
│   │   └── ...business pages
│   └── ar
│       └── ...
├── global
│   └── en                 <- Live Copy of language-master/en
│       ├── nav
│       ├── footer
│       ├── locale-directory
│       └── ...business pages
├── kz
│   ├── kk                 <- Live Copy of language-master/kk
│   └── ru                 <- Live Copy of language-master/ru
├── uz
│   ├── uz                 <- Live Copy of language-master/uz
│   └── ru                 <- Live Copy of language-master/ru
└── bh
    └── ar                 <- Live Copy of language-master/ar
```

目标交付路径与 JCR 路径一一对应：`/content/demo-site/global/en/nav` 通过 EDS 暴露为 `/global/en/nav.plain.html`。`language-master` 保留当前项目已有的单数命名，避免仅为改名而移动页面；这不改变 Adobe 官方“language master → country/language Live Copy”模式的语义。

### 官方依据

- Adobe EDS + Universal Editor 的 Header/Footer 教程规定：header/footer 内容应位于独立 AEM 页面，通过 fragment 异步加载并独立发布：<https://experienceleague.adobe.com/en/docs/experience-manager-learn/sites/edge-delivery-services/developing/universal-editor/how-to/header-and-footer>
- Adobe MSM 示例采用 `language-masters/{language}` 作为源，`{country}/{language}` 作为 Live Copy，并允许本地取消继承：<https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/sites/administering/reusing-content/msm/overview>
- Adobe MSM 最佳实践要求先规划内容流、优先 blueprint 配置、减少自定义和自动 rollout：<https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/sites/administering/reusing-content/msm/best-practices>
- EDS 内容模型强调语义化、内容源无关和单层嵌套限制：<https://www.aem.live/developer/component-model-definitions>
- Universal Editor 的 `aem-content` 字段可选择 AEM 内容并以 `rootPath` 限定选择范围：<https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/field-types>

## 2. Current-State Evidence

### 2.1 leadstec-dev（2026-07-20 只读核验）

| Check | Result | Design implication |
| --- | --- | --- |
| `/content/demo-site/language-master/en/nav` | 存在，3 sections，`cq:isDelivered=false` | 内容结构可作为迁移输入，但尚不能作为 Preview 依赖 |
| `/content/demo-site/language-master/en/footer` | 存在，`cq:isDelivered=false` | 必须独立发布，发布业务页不会自动发布 footer |
| `/content/demo-site/language-master/en/homepage` | 存在且已交付 | 新 shell 可先在母版路径验证 |
| `/content/demo-site/global` | 不存在 | 先设计和建 blueprint，再创建 `/global/en` Live Copy |
| 根级 `/content/demo-site/nav`、`footer` | 存在且旧 Preview 路径可用 | 只做迁移回退，不作为目标结构 |
| Preview `/metadata.json` | 404 | 不能把全站 metadata 当作现成 rollback 通道；默认 routing 必须独立工作 |

现有母版 nav 的站内链接仍为 `/official-center`、`/service` 等根相对路径，语言入口为 `/global/en`。rollout 前必须把链接迁移为 AEM 内容引用或语言根内路径，否则进入 `/global/en` 后会跳出当前市场/语言上下文。

### 2.2 Current runtime gaps

- `header.js`：元数据为空时固定回退 `/nav`；4 个市场和对话框标题硬编码。
- `footer.js`：元数据为空时固定回退 `/footer`。
- `scripts/scripts.js`：固定设置 `document.documentElement.lang = 'en'`。
- header 当前把 fragment 解析为品牌、主导航、工具三段并重建 DOM；footer 把标题+列表解析为列。
- 当前文档声称 `/nav` 相对语言根，但 `new URL` 只用于显式元数据，默认字符串 `/nav` 是站点绝对路径；文档与代码不一致。
- 当前 `_page.json` 不含 nav/footer/language/direction 字段；实施时必须先补字段并验证 meta 输出，才能把 override 当作作者可用能力。

## 3. Goals and Non-Goals

### Goals

- 新国家/语言只需建立语言母版/Live Copy、作者配置内容和发布，不需要修改市场数组或跳转 URL 代码。
- 默认页面自动使用同语言根的 nav/footer；页面仍可通过元数据显式覆盖。
- 保留独立 fragment 的缓存和发布边界。
- 所有可见文字、链接和面向用户的无障碍名称均可本地化。
- 失败时降级为真实链接或空 shell，不阻塞主体内容，不制造 `#` 链接。
- 保留 Universal Editor instrumentation 和可视化编辑能力。

### Non-Goals

- 自动翻译、翻译供应商接入、完整 hreflang 页面对等关系管理。
- 在运行时调用 AEM Author API；浏览器只读取 EDS delivery HTML。
- 允许任意深度的市场/语言 URL。约定且只支持 `/{market}/{language}` 两级语言根，以及母版 `/language-master/{language}`。
- 通过前端代码自动 rollout 或 publish AEM 内容。

## 4. Components and Responsibilities

| Component | Responsibility | Must not own |
| --- | --- | --- |
| Locale root resolver | 从元数据/URL 得到语言根和 fragment candidates | 市场清单、业务 URL、翻译文案 |
| Header navigation block | 用扁平、可排序的结构化条目交付一级导航、分组和卡片 | 嵌套 Rich Text、运行时业务 URL |
| Header settings block | 在 nav 内交付本地化交互文案和 locale directory 引用 | 市场选项、视觉状态 |
| Header block | 加载 nav，解析 settings，增强主导航/移动菜单/mega panel，加载 locale directory | 硬编码国家与语言 |
| Footer block | 加载 footer，增强桌面列/移动 accordion/回到顶部 | 固定英文无障碍文案 |
| Locale directory block/page | 暴露作者配置的地区、语言、目标和本地化 UI 文案 | 页面布局与交互状态 |
| AEM MSM | 从语言母版向市场语言分支同步结构和共享内容 | 翻译本身、自动发布 |
| EDS delivery | 提供页面和 `.plain.html` fragment，独立缓存 | Author-side content mutation |

## 5. Path Resolution Contract

### 5.1 Locale root grammar

- Blueprint: `/language-master/{languageTag}`
- Public: `/{marketCode}/{languageTag}`
- `marketCode` 使用稳定小写 slug；国家市场优先 ISO 3166-1 alpha-2（如 `kz`、`uz`、`bh`），`global` 是明确保留的非国家市场 slug。
- `languageTag` 使用小写 BCP 47/ISO 639 语言标识（如 `en`、`ru`、`kk`、`uz`、`ar`）；需要地区变体时允许 `en-gb`，但同一站点必须统一格式。

解析器只接受符合上述形态的路径。普通旧路径（例如 `/service/guide`）不得被误判为语言根。

### 5.2 Resolution precedence

对 `nav` 与 `footer` 使用同一纯函数和相同优先级：

1. 页面 `nav` / `footer` 元数据中的同源绝对路径或站内路径。
2. 当前页面解析出的语言根：`${localeRoot}/nav` 或 `${localeRoot}/footer`。
3. 迁移开关启用时，根级 `/nav` 或 `/footer`。
4. 无可用 fragment 时返回 `null`，主页面继续加载。

对 `locale-directory`：

1. nav 的 `header-settings.localeDirectory` 中作者配置的 AEM 内容引用。
2. `${localeRoot}/locale-directory`。
3. 不回退到 JavaScript 市场清单；缺失时把 nav 中的原始语言入口保留为普通链接。

元数据覆盖必须拒绝跨源 URL、`javascript:`、`data:` 及不以 `/` 开始的歧义路径。显式覆盖请求 404 后才继续尝试下一 candidate；每个失败只记录一次可诊断 warning。

页面模型增加可选 `nav`、`footer`（`aem-content`）、`language`（text）和 `direction`（`ltr|rtl` select）字段。它们用于特殊页面和受控诊断，不要求普通页面逐页配置，也不依赖当前尚不存在的 `/metadata.json`。

### 5.3 Public URL examples

| Current page | nav | footer | locale directory |
| --- | --- | --- | --- |
| `/language-master/en/homepage` | `/language-master/en/nav` | `/language-master/en/footer` | `/language-master/en/locale-directory` |
| `/global/en/homepage` | `/global/en/nav` | `/global/en/footer` | `/global/en/locale-directory` |
| `/kz/ru/service` | `/kz/ru/nav` | `/kz/ru/footer` | `/kz/ru/locale-directory` |
| `/service`（迁移期） | metadata override or `/nav` | metadata override or `/footer` | authored direct link only |

## 6. Content Contracts

### 6.1 Nav page

保留三段 section 契约，但把 Primary section 的首选作者模型改为结构化 collection：

1. Brand section：带链接的 logo 图片；链接必须指向当前语言根首页。
2. Primary section：优先使用 `header-navigation` container；其中扁平 `header-navigation-item` 按 `top → group → card` 顺序表达一级菜单、面板分组和卡片。迁移期仍接受原顶级/嵌套无序列表作为 fallback。
3. Tools section：保留真实语言入口链接和本地化 label；增强成功后成为语言选择器 trigger，增强失败时仍可跳转。该 section 还包含一个单例 `header-settings` block。

`header-settings` 是无子项的普通 block，source DOM 在 fragment decoration 后必须保持可解析。它提供：

`header-navigation` 使用三个短小的 item model，Author 不需要维护 HTML/list 层级，也不会在一个 dialog 中看到无关字段：

| Model | Fields | Purpose |
| --- | --- | --- |
| `header-navigation-top` | `label`, `destination` | 一级菜单；destination 使用 `/content/demo-site` picker |
| `header-navigation-group` | `label` | 面板分组标题 |
| `header-navigation-card` | `label`, `destination`, multi `media`, `description` | 面板卡片；media 第一张为背景、第二张为可选前景字标 |
| `header-navigation` | `cardActionLabel` | 当前语言所有卡片共享的 CTA 文案 |

内容顺序即结构：`top` 开始一个一级菜单，之后的 `group` 和 `card` 归属该菜单，直到下一个 `top`。孤立的 `group/card` 被忽略并记录为无效内容。这样保持单层 container + item，不使用不稳定的 multi-container/nested multifield。

Author 画布必须保持所有 item 为同级、独立可选的编辑卡片，并明确显示类型、顺序、目标路径和未配置状态；不得为了预览最终 mega menu 而把带 `data-aue-*` 的 item 嵌套到另一个 item 下。block 同时生成一个无 instrumentation 的隐藏语义投影供 header parser 使用；Delivery 只输出语义 `ul`。因此 Content Tree 与 overlay 始终操作扁平 item，而最终 header 仍按 `top → group → card` 顺序形成层级。

| Field | Type | Required | Purpose |
| --- | --- | --- | --- |
| `localeDirectory` | aem-content | yes | 当前语言的 locale-directory 页面引用 |
| `primaryNavigationLabel` | text | yes | 主导航 accessible name |
| `openNavigationLabel` | text | yes | 移动端打开菜单 accessible name |
| `closeNavigationLabel` | text | yes | 移动端关闭菜单 accessible name |
| `backNavigationLabel` | text | yes | 移动端返回上级 accessible name |
| `localeDialogTitle` | text | yes | 地区/语言对话框可见标题 |
| `localeTriggerLabel` | text | yes | 地球按钮和移动端语言入口 label |
| `localeCloseLabel` | text | yes | 关闭选择器 accessible name |

settings 缺失或无效时，header 不使用固定英文替代值：保留 source semantic nav/tools；locale directory 缺失只影响选择器增强，不阻止主导航内容被读取。

作者链接优先通过 AEM 内容选择器/链接对话框指向站内页面，避免手输 `/service`。MSM rollout 后必须验证链接已重写到目标 Live Copy；未重写的链接作为发布阻断项。

### 6.2 Footer page

保留现有语义内容模型：

1. Navigation section：重复的 heading + 紧随其后的 `ul`，顺序即列顺序。
2. Bottom section：版权、政策、社交链接和可选回到顶部链接。

回到顶部必须来自真实 `#top`（或约定 anchor）链接，作者提供本地化文本；JS 只增强滚动行为和显示时机。若未配置，不显示按钮，不使用固定英文占位。

### 6.3 Locale directory page and model

每个语言根有一个 `locale-directory` 专用页面。页面包含一个 container block 和扁平 `locale-option` 子项；container 本身不承载 header 文案。不使用嵌套 multifield，避免 Universal Editor container nesting 限制并符合 EDS 单层内容模型。

Repeated `locale-option` fields:

| Field | Type | Required | Validation / semantics |
| --- | --- | --- | --- |
| `marketCode` | text | yes | 稳定分组键；`^[a-z][a-z0-9-]{1,15}$` |
| `marketLabel` | text | yes | 当前 UI 语言显示的市场名 |
| `languageTag` | text | yes | BCP 47 标签；用于 `lang`/`hreflang` |
| `languageLabel` | text | yes | 用户看到的语言名 |
| `link` | aem-content | yes | AEM 站内目标或显式外部 URL |
| `enabled` | boolean | yes | 默认 false；只展示已完成预览验收的目标 |
| `textDirection` | select | yes | `ltr` 或 `rtl`，目标语言根的文字方向 |

规则：

- 内容顺序即展示顺序；同一 `marketCode` 的连续项组成一个市场行。
- 同一 `marketCode` 的所有项必须连续；同一 code 在后续位置再次出现属于配置错误。
- 同一目录内 `(marketCode, languageTag)` 和规范化 `link` 必须唯一。
- 同一 `marketCode` 的 `marketLabel` 必须一致。
- `enabled=true` 的站内 link 必须在 Preview 返回 200，且目标语言根存在对应 nav/footer/locale-directory。
- 不能用 `isExternal`、`newWindow` 等展示标志代替 URL 语义；运行时根据 URL origin 判断。
- `enabled=false` 用于先配置后上线；目标未发布时不得开启。

### 6.4 Document language and direction

页面 `language`/`direction` 元数据（若存在）优先；否则从 locale root 的 `languageTag` 推导语言。为了避免首次渲染方向闪动，eager 阶段以 BCP 47 主语言子标签和标准 RTL 语言集合推导初始方向；locale directory 加载后使用当前 option 的 `textDirection` 做一致性校验并可纠正。该 RTL 集合属于语言排版技术数据，不包含任何市场、展示名或业务 URL。运行时设置：

- `<html lang="...">`
- `<html dir="ltr|rtl">`
- 当前 locale option 的 `aria-current="true"`
- locale links 的 `hreflang`

技术代码可以校验 BCP 47/方向取值，但不得维护业务市场到语言的静态映射。完整 SEO `<link rel="alternate">` 需要页面对等关系，属于后续 capability。

## 7. Data Flow

```text
Browser requests /global/en/homepage
  -> EDS returns page shell + metadata
  -> eager stage resolves lang/initial dir from URL or metadata
  -> lazy stage loads header and footer
     -> resolver selects /global/en/nav and /global/en/footer
     -> header loads /global/en/locale-directory
     -> semantic source DOM is progressively enhanced
  -> author interactions use only delivered anchors and authored labels

Author edits language-master/en/nav
  -> review on language-master Preview
  -> controlled MSM rollout to global/en/nav
  -> verify inheritance/local overrides and rewritten links
  -> publish locale-directory, nav/footer, then dependent pages
  -> EDS updates fragments independently from business page caches
```

## 8. Rendering and Progressive Enhancement

- header/footer 的 source fragment 在成功取得并解析之前不得清空现有 block。
- parser 先生成数据并验证最小契约，再执行 DOM 增强；解析失败时保留原语义 DOM。
- 不再以 `href="#"` 填充缺失链接；无 href 的项目呈现为 button/label 或跳过。
- locale directory 必须先产生包含真实 anchors 的语义 DOM；桌面 dialog 和移动列表复用同一数据/节点语义，不维护两份市场数组。
- Universal Editor instrumentation 在 nav 源页面迁移到扁平编辑卡，不迁移到隐藏语义投影；最终 header 的桌面/移动双视图仍须能追溯到对应作者资源。
- 页面主内容不等待 locale directory；nav 与 header-settings 允许先增强品牌/主导航，locale directory 完成后再增强语言选择器，避免额外请求影响 LCP。
- fragment 请求按 path 缓存进行中的 Promise，避免同页重复请求；失败不得永久缓存，允许重试/刷新恢复。

## 9. Interaction and Accessibility Contract

- 桌面和移动端保留当前视觉/交互目标，但全部用户文案来自当前语言内容。
- desktop mega panel、locale dialog、mobile drawer 的触发器使用真实 button，并同步 `aria-expanded`、`aria-controls`、`aria-haspopup`。
- locale dialog 使用唯一、实例作用域内的 ID，防止多次初始化冲突。
- 打开 modal/drawer 后焦点进入，Tab 被约束，Escape 关闭，关闭后返回原 trigger。
- 当前页面和当前语言使用 `aria-current`；不能仅依赖颜色表示状态。
- localized homepage 同时支持语言根本身（如 `/global/en`）和显式 `/homepage` slug；两者都按首页主题规则处理。
- 390、1024、1440、1920 px 无横向溢出；长市场名和 RTL 文本可换行。
- `prefers-reduced-motion` 下禁用非必要动画和平滑滚动。
- JS 或 locale directory 失败时，tools section 的普通语言链接必须仍可键盘访问。

## 10. MSM and Author Governance

### 10.1 Blueprint and rollout

- 为 `/content/demo-site/language-master` 建立正式 blueprint 配置；优先使用标准 rollout configuration。
- 不启用 `onModify` 自动 rollout。采用“母版编辑 → 审核 → 手动 rollout → 目标 Preview 验证 → 发布”的治理流程。
- `nav`、`footer`、`locale-directory` 都属于语言根源树，因此创建 Live Copy 时一并生成，避免在目标语言根下手工补同名页面。
- 市场差异通过页面/组件级取消继承实现；取消前记录 owner、原因和回归责任。
- 翻译由 Language Copy/Translation Project 管理；MSM 只负责结构和复用，不被当作翻译工具。

### 10.2 Ownership

| Content | Global language owner | Market owner | Release owner |
| --- | --- | --- | --- |
| master nav/footer structure | owns | proposes change | approves rollout |
| translated labels | translation owner | reviews | verifies |
| local legal/footer links | provides baseline | owns local override | verifies |
| locale destinations/readiness | platform owner | confirms target | enables/publishes |

## 11. Migration and Deployment

### Phase 0 — Inventory and backup

- 导出/记录根级 `/nav`、`/footer` 与母版 nav/footer 的内容和发布状态。
- 建立链接清单，标记根相对、AEM 引用、外部 URL 和 404。
- 记录当前 header/footer 截图、键盘行为和 `.plain.html` 响应作为基线。

### Phase 1 — Backward-compatible code

- 上线路径解析器、动态 lang/dir、locale directory 支持和防御性 parser。
- 保留 metadata override 与根级 migration fallback。
- 未创建 `/global/en` 前，现有站点行为不得回归。

### Phase 2 — Authoring source

- 在 `/language-master/en` 完成 nav/footer 内容修正并创建 `locale-directory`。
- 所有站内链接改为语言根内容引用；只启用已经可访问的 locale option。
- 发布母版 fragment 到 Preview，验证 `.plain.html`、UE instrumentation 和可编辑性。

### Phase 3 — MSM rollout

- 创建 blueprint 后生成 `/global/en` Live Copy。
- 验证 nav/footer/locale-directory 的 Live Relationship、链接重写、局部继承策略。
- 不在 `/global/en` 手工复制同名页面来绕过 rollout。

### Phase 4 — Preview cutover

发布顺序：

1. locale destination pages required by enabled options
2. `locale-directory`
3. `nav` and `footer`
4. homepage and representative business pages

验证 `/global/en/*.plain.html`、四个断点、键盘/屏幕阅读器基本路径、0 console error 和无跨语言错误跳转。

### Phase 5 — Live and observation

- 先发布一个市场语言（`global/en`）作为 canary。
- 观察 404、fragment fetch failures、locale clicks、JS errors 和页面性能至少一个完整发布周期。
- 扩展到其他语言时重复同一 gate，不批量启用未验收目标。

### Phase 6 — Legacy retirement

- 删除代码中的 root fallback feature flag/分支。
- 在确认没有页面 metadata 指向旧路径后，先从 Preview/Live 取消交付根级 `/nav`、`/footer`，再决定是否归档 AEM 页面。
- `/site/nav` 旧代码不纳入迁移，也不成为任何 fallback。

## 12. Failure Modes and Recovery

| Failure | Runtime behavior | Recovery |
| --- | --- | --- |
| localized nav 404 | 迁移期尝试 `/nav`；退役后 header 留空且主体可用 | 发布目标 nav；已具备 page metadata field 时可对受影响页面临时指向 last-known-good |
| localized footer 404 | 同上 | 发布目标 footer |
| locale-directory 404 | 保留 tools 普通语言链接，不打开空 dialog | 发布目录或修正引用 |
| invalid locale option | 跳过该项并记录一次 warning | 作者修正字段后重发目录 |
| destination 404 | release gate 阻断 `enabled=true` | 发布目标后再启用 |
| MSM rollout overwrites local change | 从版本/Live Copy 状态恢复，重新建立明确 override | 修正继承治理，不以 detach 作为常规手段 |
| new code regression | 观察期由 migration fallback 自动兜底，或回滚代码；page metadata 仅做小范围 override | 修复后重新 canary |
| stale fragment cache | fragment 独立重发/刷新，业务页无需整体重发 | 核对发布状态与 CDN response headers |

永久 detach Live Copy 不作为日常回滚，因为 Adobe 明确其不可逆。

## 13. Validation Strategy

### Round A — Fact and contract validation

- 对照 `leadstec-dev` 路径、`cq:isDelivered`、实际 `.plain.html` 和现有 JS 解析行为。
- 证明每个示例页面只解析到一个确定 locale root。
- 对 nav/footer/locale-directory 的最小、完整、缺失和 malformed DOM 建 fixture。

### Round B — Architecture and authoring validation

- 运行 `npm run build:json`，验证 definition/model/filter 合并。
- 在 Universal Editor 添加、删除、排序 locale option，验证字段校验和 instrumentation。
- 在 AEM 验证 blueprint、Live Relationship、rollout、取消继承与链接重写。
- 确认内容结构保持 EDS 单层 nesting；不引入 nested multifield。

### Round C — Operational and experience validation

- Preview 请求矩阵覆盖母版、`global/en`、至少一个双语市场、旧路径与显式 metadata override。
- 390、1024、1440、1920 px 验证 header/footer；覆盖 LTR、RTL、长标签。
- 键盘验证：Tab、Shift+Tab、Enter/Space、Escape、焦点恢复；校验 ARIA 状态。
- 故障注入：nav/footer/directory 404、无 enabled options、重复 option、无图片/无 CTA、慢请求。
- 运行 lint、纯函数单元测试、浏览器 smoke/E2E；确认 0 console error、无水平溢出。

## 14. Traceability Matrix

| Need | Decision | Spec | Verification |
| --- | --- | --- | --- |
| nav/footer 位于语言下 | sibling fragments under locale root | localized-shell-resolution | path matrix + Preview 200 |
| 可新增国家/语言 | authored flat locale options | locale-directory | UE add/reorder + no code diff |
| 不使用旧 `/site/nav` | excluded from candidates | localized-shell-resolution | candidate unit tests |
| AEM 官方跨国复用 | blueprint + Live Copy | all content specs | MSM relationship audit |
| 作者可控跳转 | `aem-content`/real anchor | global-navigation, locale-directory | link audit + destination 200 |
| 多语言 UI | authored UI labels + dynamic lang/dir | all specs | LTR/RTL and a11y checks |
| 可安全上线 | phased canary + migration fallback | localized-shell-resolution | rollback rehearsal |
| fragment 独立更新 | dedicated pages + publish order | global-navigation, global-footer | isolated republish test |

## 15. Decisions and Alternatives

### Decision 1: nav/footer are siblings of localized pages

Chosen because the current page URL can deterministically find its shell, MSM copies a complete language subtree, and local owners can override shell content without page-level metadata on every page.

Rejected:

- Root `/nav` and `/footer`: one global copy cannot express market/language differences.
- `/site/nav`: legacy implementation explicitly out of scope and does not follow the target locale tree.
- Per-page copied nav/footer: duplicates content, breaks independent publishing and governance.

### Decision 2: language master is source; public branch is Live Copy

Chosen to align with Adobe MSM and avoid two manually maintained copies.

Rejected:

- Publishing only `language-master/en` as the public site: mixes blueprint and market delivery responsibilities.
- Independent `/global/en` copy: produces drift and no governed rollout.

### Decision 3: locale directory is authored data, not JavaScript

Chosen so new markets and destinations can be released through content governance. Flat child items respect EDS/UE nesting constraints and are easy to sort.

Rejected:

- Hardcoded array: requires code release for business data.
- Deep market → languages nested multifield: conflicts with Universal Editor container nesting limitations.
- One site-wide English-only directory: cannot localize market labels and accessible strings.

### Decision 4: metadata override remains, but is not the default localization mechanism

Chosen for campaign/special pages、诊断和小范围 rollback。页面模型必须先提供这些字段；当前 404 的 `/metadata.json` 不被视为既有依赖。Locale-root derivation prevents repetitive metadata across every page.

Rejected:

- Metadata-only routing: scalable in theory but creates duplicated rows/configuration and a single metadata outage can break every shell path.
- Path-only routing: lacks emergency override and special-page support.

## 16. Open Questions for Approval

1. Public slugs are confirmed as `/global/en`, `/kz/kk`, `/kz/ru`, `/uz/uz`, `/uz/ru`, `/bh/ar` or will any market retain legacy forms such as `/ru_kz`?
2. Which locale destinations are launch-ready? Only those may start with `enabled=true`.
3. Is Bahrain/Arabic in the first launch wave? If yes, RTL acceptance becomes P0 for the first implementation rather than a later-language gate.
4. Who owns blueprint rollout approval and who owns local footer/legal overrides?

这些问题不改变核心架构，但会决定第一轮 Author 内容与验收矩阵。
