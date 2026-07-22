# Global Navigation Specification

## ADDED Requirements

### Requirement: Dedicated Localized Nav Page

header SHALL 从当前语言根的独立 `nav` AEM 页面加载内容，并支持安全页面 metadata override。

#### Scenario: Load localized nav

- **WHEN** 页面位于 `/global/en/about-us`
- **AND** 没有 nav override
- **THEN** header 请求 `/global/en/nav.plain.html`

#### Scenario: Nav updates independently

- **WHEN** 作者发布 `/global/en/nav`
- **THEN** 使用该 fragment 的页面可取得新导航
- **AND** 不要求重新发布每个业务页面

### Requirement: Semantic Nav Content Contract

nav fragment SHALL 支持按顺序排列的 Brand、Primary Navigation、Tools 三个 semantic sections。

#### Scenario: Complete nav fragment

- **WHEN** fragment 包含 linked logo、primary list 和 tools language link
- **THEN** header 增强并展示品牌、主导航和语言 trigger

#### Scenario: Missing optional card content

- **WHEN** mega panel card 缺少图片、subtitle 或 CTA
- **THEN** header 只渲染存在的内容
- **AND** 不产生空视觉占位或虚假链接

### Requirement: Structured Primary Navigation Authoring

Primary Navigation SHALL 提供 `header-navigation` container + flat item authoring model，使作者无需编辑嵌套 Rich Text，并在迁移期兼容原 semantic list。

#### Scenario: Author adds a direct navigation link

- **WHEN** 作者添加 `top` item 并打开 Destination picker
- **THEN** picker 从 `/content/demo-site` 打开并允许选择目标页面
- **AND** 保存的目标作为真实 AEM content reference 交付

#### Scenario: Author builds a mega panel

- **WHEN** 作者按 `top → group → card` 顺序添加条目
- **THEN** header 把 group 和 cards 归入最近的 top item
- **AND** 作者可独立新增、删除、复制和排序每个条目

#### Scenario: Author edits items without nested overlays

- **WHEN** `header-navigation` 在 Universal Editor 画布中渲染
- **THEN** top、group 和 card 作为同级编辑卡片显示类型、顺序和已选目标
- **AND** 每张卡片可独立选中并打开自己的 Properties
- **AND** delivery 所需的菜单层级不得把一个带 instrumentation 的 item 嵌套到另一个 item 下

#### Scenario: Legacy rich text remains during migration

- **WHEN** Primary section 同时存在结构化 navigation 和旧 nested list
- **THEN** header 优先解析结构化 navigation
- **AND** 结构化 navigation 缺失时继续解析旧 list

### Requirement: Locale Selector Uses Authored Directory

header SHALL 从当前语言根/显式引用的 locale directory 构建桌面和移动 selector，不得使用 JavaScript 市场数组。

#### Scenario: Desktop and mobile share data

- **WHEN** directory 包含 N 个 enabled options
- **THEN** desktop dialog 与 mobile language panel 使用相同 N 个 options
- **AND** 两者保持相同顺序、labels 和 destinations

#### Scenario: Directory unavailable

- **WHEN** locale-directory 请求失败或没有有效 enabled options
- **THEN** header 不打开空 dialog
- **AND** tools section 的作者语言链接保持为普通可用 anchor

### Requirement: Authored Header Settings

nav Tools section SHALL 包含一个单例 `header-settings` block，以 AEM content reference 指向 locale directory，并提供全部本地化交互与 accessible labels。

#### Scenario: Valid settings are applied

- **WHEN** header-settings 包含有效 directory reference 和 labels
- **THEN** header 使用这些 labels 配置 primary nav、mobile open/close/back 和 locale dialog controls
- **AND** header 从 referenced directory 加载 locale options

#### Scenario: Settings are missing

- **WHEN** header-settings 缺失或 required labels 无效
- **THEN** header 保留可读的 source semantic nav/tools
- **AND** header 不注入固定英文替代 labels

### Requirement: Author-Controlled Links

品牌、主导航、mega cards 和 locale options SHALL 使用作者配置的真实 AEM 内容引用或外部 URL。

#### Scenario: Internal navigation stays in locale

- **WHEN** `/global/en/nav` 中的 Service link 指向该 Live Copy 的 Service page
- **THEN** 用户跳转到 `/global/en/service`
- **AND** 不跳转到根级 `/service`

#### Scenario: External locale destination

- **WHEN** locale option 使用有效外部 HTTPS URL
- **THEN** header 保留该 URL
- **AND** 不尝试把它当作 fragment path

### Requirement: Progressive Nav Enhancement

header SHALL 在 fragment 已取得且最小内容契约通过后才替换/增强 source DOM。

#### Scenario: Parser rejects malformed content

- **WHEN** primary navigation section 无法解析
- **THEN** header 保留可读 source fragment
- **AND** 不把 block 清空为不可导航状态

#### Scenario: Missing item href

- **WHEN** primary item 没有 href 且代表可展开 panel
- **THEN** 系统使用 button 语义触发展开
- **AND** 不生成 `href="#"`

### Requirement: Localized Accessible Names

header 的 primary nav、mobile open/close/back、locale trigger/dialog/close accessible names SHALL 来自当前语言内容。

#### Scenario: Localized mobile menu

- **WHEN** current header-settings 提供 Russian UI labels
- **THEN** mobile menu controls 使用 Russian accessible names
- **AND** 不显示固定英文 Open/Close/Back labels

### Requirement: Navigation Accessibility

desktop panels、locale dialog 和 mobile drawer SHALL 支持键盘、同步 ARIA 状态、管理焦点并尊重 reduced motion。

#### Scenario: Open and close locale dialog

- **WHEN** 键盘用户激活 locale trigger
- **THEN** dialog 打开且焦点进入 dialog
- **AND** trigger 的 `aria-expanded` 为 true
- **WHEN** 用户按 Escape
- **THEN** dialog 关闭且焦点返回 trigger

#### Scenario: Mobile focus containment

- **WHEN** mobile drawer 打开
- **THEN** Tab/Shift+Tab 保持在 drawer 可见 controls 内
- **AND** 关闭后焦点返回 hamburger button

#### Scenario: Current link state

- **WHEN** nav item destination 与当前页面规范化路径相同
- **THEN** link 使用 `aria-current="page"`

### Requirement: Responsive Navigation

header SHALL 在 mobile、medium 和 desktop viewports 中保持可用、无水平溢出，并支持长 label 与 RTL 内容。

#### Scenario: Mobile viewport

- **WHEN** viewport 宽度为 390px
- **THEN** 使用 full-screen drawer
- **AND** 所有 authored links 可通过菜单访问
- **AND** 页面无水平溢出

#### Scenario: Desktop viewport

- **WHEN** viewport 宽度为 1440px 或 1920px
- **THEN** primary nav、mega panel 和 locale dialog 均在 viewport 内

#### Scenario: RTL viewport

- **WHEN** document direction 为 rtl
- **THEN** controls、文本对齐和 focus order 保持可理解
- **AND** selector 不因长阿拉伯文 label 溢出

### Requirement: Header Theme Compatibility

header SHALL 保留首页 transparent-to-white 行为和非首页 white 默认行为，且 localized path 不影响首页识别。

#### Scenario: Localized homepage

- **WHEN** 页面为 `/global/en/homepage`
- **AND** 没有 white override
- **THEN** header 初始使用 transparent theme
- **AND** 滚动超过约定阈值后使用 white state

#### Scenario: Locale root is the homepage

- **WHEN** 页面路径恰好为 `/global/en`
- **AND** 没有 white override
- **THEN** header 按 localized homepage 使用 transparent theme

#### Scenario: Localized interior page

- **WHEN** 页面为 `/global/en/service`
- **AND** 没有 transparent override
- **THEN** header 从首次渲染即使用 white theme

### Requirement: Universal Editor Navigation Instrumentation

header SHALL 把 Brand、Primary items、groups、cards、tools 和 locale options 的 Universal Editor instrumentation 保留在对应增强元素上。

#### Scenario: Edit a nav item

- **WHEN** 作者在 Universal Editor 选中已增强 primary nav item
- **THEN** 编辑器定位到原 nav page 的对应资源

#### Scenario: Desktop and mobile representation

- **WHEN** 同一 authored item 同时具有 desktop 和 mobile representation
- **THEN** 两种表示均保留可追溯到 source resource 的 instrumentation

### Requirement: No Header Business Hardcoding

header JavaScript SHALL 不持有 market names、language labels、locale destinations 或可翻译 dialog title。

#### Scenario: Content-only locale change

- **WHEN** 作者修改 locale dialog title 或新增 enabled option
- **THEN** 发布相关 content 后 header 展示变化
- **AND** 不需要重新部署代码
