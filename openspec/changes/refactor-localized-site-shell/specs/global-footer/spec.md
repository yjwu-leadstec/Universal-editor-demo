# Global Footer Specification

## ADDED Requirements

### Requirement: Dedicated Localized Footer Page

footer SHALL 从当前语言根的独立 `footer` AEM 页面加载内容，并支持安全页面 metadata override。

#### Scenario: Load localized footer

- **WHEN** 页面位于 `/kz/ru/service`
- **AND** 没有 footer override
- **THEN** footer 请求 `/kz/ru/footer.plain.html`

#### Scenario: Footer updates independently

- **WHEN** 作者只发布 `/kz/ru/footer`
- **THEN** 对应语言站点可取得新的 footer 内容
- **AND** 不要求重新发布所有业务页面

### Requirement: Semantic Footer Content Contract

footer SHALL 从重复 heading + following list 提取导航列，并从 bottom section 提取版权、政策和社交内容。

#### Scenario: Render multiple columns

- **WHEN** footer navigation section 包含五组 heading + non-empty list
- **THEN** desktop footer 按作者顺序渲染五列
- **AND** mobile footer 按相同顺序渲染五个 accordion items

#### Scenario: Skip an empty column

- **WHEN** heading 后没有有效 list items
- **THEN** footer 不渲染空列

#### Scenario: Optional bottom content

- **WHEN** footer 只配置版权和两个 policy links
- **THEN** 系统只渲染这些 authored items
- **AND** 不补造社交 links 或 legal text

### Requirement: Author-Controlled Footer Links

footer navigation、policy、social 与市场法律链接 SHALL 来自当前 localized footer content。

#### Scenario: Market-local legal link

- **WHEN** `/bh/ar/footer` 取消继承并配置本地 policy URL
- **THEN** Bahrain Arabic 页面使用该 URL
- **AND** 其他 locale footers 不受影响

#### Scenario: Internal footer link stays in locale

- **WHEN** `/global/en/footer` 的 About Us link 指向其 Live Copy page
- **THEN** 用户跳转到 `/global/en/about-us`

### Requirement: Authored Back-to-Top Control

回到顶部 control SHALL 由 footer 中真实 anchor 和本地化 label 提供，JavaScript 只增强显示和滚动行为。

#### Scenario: Enhance a configured control

- **WHEN** footer bottom section 含指向 `#top` 的 authored link
- **THEN** 系统把它增强为 back-to-top control
- **AND** accessible name 使用 authored link text

#### Scenario: No configured control

- **WHEN** footer 未提供 back-to-top link
- **THEN** 系统不渲染 back-to-top button
- **AND** 不使用固定英文 label

#### Scenario: Reduced motion

- **WHEN** 用户启用 reduced motion
- **AND** 激活 back-to-top control
- **THEN** 页面立即滚动到顶部而不使用平滑动画

### Requirement: Progressive Footer Enhancement

footer SHALL 在 fragment 取得且最小契约通过后才增强 source DOM，并在失败时保留主体页面可用。

#### Scenario: Malformed footer

- **WHEN** fragment 不含有效 column 或 bottom content
- **THEN** 系统不抛出未处理异常
- **AND** 保留取得的语义内容或不渲染 footer enhancement

#### Scenario: Missing link href

- **WHEN** footer item 没有有效 href
- **THEN** 系统将其作为 plain text 或跳过
- **AND** 不生成 `href="#"`

### Requirement: Footer Accessibility

mobile accordion 和 back-to-top control SHALL 使用正确 button/link 语义、ARIA 状态与键盘行为。

#### Scenario: Toggle mobile accordion

- **WHEN** keyboard user 激活 accordion heading button
- **THEN** 对应 panel 展开
- **AND** button 的 `aria-expanded` 变为 true
- **AND** heading 与 panel 具有可解析的关联

#### Scenario: Preserve link focus

- **WHEN** accordion 展开
- **THEN** 其中所有 authored links 可按 DOM 顺序获得焦点

### Requirement: Responsive Footer

footer SHALL 在 390、1024、1440 和 1920px viewports 中保留所有 authored content 且无水平溢出。

#### Scenario: Mobile layout

- **WHEN** viewport 为 390px
- **THEN** footer 使用自然高度 accordion layout
- **AND** long legal text 可换行
- **AND** 页面无水平溢出

#### Scenario: Desktop layout

- **WHEN** viewport 为 1440px 或 1920px
- **THEN** columns 在最大内容宽度内布局
- **AND** bottom content 保持可读顺序

#### Scenario: RTL footer

- **WHEN** document direction 为 rtl
- **THEN** column/accordion labels 和 disclosure affordance 方向一致
- **AND** focus order 保持逻辑顺序

### Requirement: Universal Editor Footer Instrumentation

footer SHALL 将每个 authored column 和 bottom content 的 instrumentation 保留在 desktop/mobile 增强表示上。

#### Scenario: Edit a footer column

- **WHEN** 作者在 Universal Editor 选择 desktop 或 mobile footer column
- **THEN** 编辑器定位到 localized footer page 的对应 source resource

#### Scenario: Edit legal content

- **WHEN** 作者选择 enhanced bottom content
- **THEN** 其 instrumentation 仍指向原 bottom section/resource

### Requirement: Localized Footer Failure Isolation

一个 locale 的 footer 内容或发布失败 SHALL 不改变其他 locale 的 footer path 或内容。

#### Scenario: One locale footer is unavailable

- **WHEN** `/kz/ru/footer` 返回 404
- **THEN** `/global/en/footer` 仍按其自身 path 正常加载
- **AND** 系统不把 Global English footer 当作永久 Russian fallback

