# Change: Refactor Localized Site Shell

## Why

现有 header/footer 虽然符合 EDS“独立页面 + 异步 fragment”的基本模式，但运行时默认固定加载 `/nav` 与 `/footer`，地区/语言列表及多项无障碍文案硬编码在 JavaScript 中，`html.lang` 也固定为 `en`。这使 `/content/demo-site/language-master/en/nav` 与 `/footer` 无法被当前页面自动使用，也无法由作者在不发版的情况下增加国家、语言或修改跳转。

`leadstec-dev` 已存在 `/content/demo-site/language-master/en/nav` 和 `/footer`，但尚未建立 `/content/demo-site/global`。本变更要在创建国家站之前固定一套与 Adobe EDS、Universal Editor、MSM/Language Copy 协同工作的内容树和运行契约，避免继续依赖准备淘汰的根级 `/nav`、`/footer`。

## What Changes

- 采用语言母版到市场语言站点的内容树：
  - 源内容：`/content/demo-site/language-master/{language}`
  - 公开站点：`/content/demo-site/{market}/{language}`
  - 每个语言根下包含同级 `nav`、`footer`、`locale-directory` 页面。
- 将 `/global/en` 建为 `/language-master/en` 的 MSM Live Copy；后续国家/语言站点沿用同一规则，并允许在市场分支取消局部继承。
- 新增共享的本地化 shell 路径解析器：页面元数据覆盖优先，其次使用当前 URL 的语言根，迁移期最后才允许根级 `/nav`、`/footer` 回退。
- 保留 header/footer 为独立 AEM 页面和 EDS fragment，不把全站导航复制到每个业务页面。
- 在 nav 的 Tools section 中增加单例 `header-settings` block，承载本地化交互/无障碍文案和 `locale-directory` 内容引用；将地区/语言目录改为 Universal Editor 可维护的容器模型，用扁平 `locale-option` 子项表达市场和语言，运行时按稳定 `marketCode` 分组。
- 将 Primary Navigation 从单个嵌套 Rich Text 升级为 `header-navigation` 容器和按顺序排列的扁平 `header-navigation-item` 子项；站内目标使用 `aem-content` picker，并在迁移期继续兼容旧 Rich Text 列表。
- 移除业务市场、语言、标题和跳转 URL 的 JavaScript 硬编码；缺失或无效配置时保留可用的普通语言链接，不生成虚假链接。
- 使页面语言、文字方向、选择器 `hreflang`、当前项状态和 header/footer 的用户可见/无障碍文案与当前语言配置一致。
- 定义迁移、发布、缓存、失败降级、回滚、MSM 治理与验证流程；根级 `/nav`、`/footer` 仅作为有时限的迁移保险，完成观察期后退役。

## Impact

- Affected specs:
  - `localized-shell-resolution`（新增）
  - `global-navigation`（新增）
  - `global-footer`（新增）
  - `locale-directory`（新增）
- Expected implementation areas after approval:
  - `blocks/header/header.js` / `header.css`
  - `blocks/footer/footer.js` / `footer.css`
  - `blocks/fragment/fragment.js`
  - `scripts/scripts.js` 与新的 shell/locale 纯函数模块
  - `blocks/header-settings/_header-settings.json`、`blocks/header-navigation/_header-navigation.json`、`blocks/locale-directory/_locale-directory.json` 及其 source-preserving 装饰逻辑
  - `models/_page.json` 中可选的 nav/footer/language/direction metadata fields
  - 合并后的 `component-*.json`
  - header/footer 作者手册和迁移运行手册
- AEM content/admin impact:
  - 为 `language-master` 建立 blueprint 配置与受控 rollout 流程
  - 创建 `/global/en` Live Copy 及其 `nav`、`footer`、`locale-directory`
  - 修正 fragment 内部链接为语言根内的 AEM 内容引用
  - 为特殊页面/受控回滚补齐可作者配置的 page metadata；默认 localized routing 不依赖 metadata 页面
  - 按依赖顺序发布到 Preview/Live
- Compatibility:
  - 元数据 `nav`、`footer` 覆盖继续支持。
  - 迁移阶段保留 `/nav`、`/footer` 回退；退役是单独的受控任务，不在首次代码上线时删除旧内容。

## Non-Goals

- 本提案不创建或修改 `leadstec-dev` 内容，也不实现 header/footer 代码；批准后再进入实施。
- 不在本变更中交付翻译供应商集成、自动翻译或完整 SEO alternate/canonical 映射。
- 不把 header/footer 改造成传统 AEM Core Component 或 Experience Fragment；EDS 的独立页面 fragment 模式保持不变。
- 不恢复或继续维护旧 `/site/nav` 代码路径。

## Approval Gate

实施前需要确认：

1. 公开 URL 采用 `/{market}/{language}/...`，首个市场为 `/global/en`。
2. `/language-master/en` 是源内容，`/global/en` 是实际交付的 Live Copy，而不是两套互不关联的手工副本。
3. 地区/语言目录按 UI 语言分别维护/翻译，并随对应语言母版 rollout；不再由 JavaScript 持有市场清单。
4. 迁移观察期结束后，根级 `/nav`、`/footer` 停止作为默认回退并从交付侧退役。
