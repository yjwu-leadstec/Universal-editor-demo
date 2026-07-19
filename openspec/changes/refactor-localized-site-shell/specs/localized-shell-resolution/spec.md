# Localized Shell Resolution Specification

## ADDED Requirements

### Requirement: Locale Root Structure

系统 SHALL 支持 `/language-master/{languageTag}` 母版语言根和 `/{marketCode}/{languageTag}` 公开语言根，并将 header、footer、locale directory 视为语言根的同级子页面。

#### Scenario: Resolve a language-master page

- **WHEN** 当前路径为 `/language-master/en/homepage`
- **THEN** 系统将 locale root 解析为 `/language-master/en`
- **AND** nav candidate 为 `/language-master/en/nav`
- **AND** footer candidate 为 `/language-master/en/footer`

#### Scenario: Resolve a public market page

- **WHEN** 当前路径为 `/global/en/homepage`
- **THEN** 系统将 locale root 解析为 `/global/en`
- **AND** locale directory candidate 为 `/global/en/locale-directory`

#### Scenario: Do not misclassify a legacy page

- **WHEN** 当前路径为 `/service/guide` 且第二段不是有效 language tag
- **THEN** 系统不将 `/service/guide` 解析为 locale root

### Requirement: Fragment Resolution Precedence

系统 SHALL 依次使用安全的页面元数据覆盖、当前语言根同级 fragment、迁移期根级 fallback 来解析 nav/footer。

#### Scenario: Metadata override wins

- **WHEN** 页面具有有效同源 `nav` 元数据 `/campaign/en/special-nav`
- **AND** 当前语言根也存在默认 nav
- **THEN** 系统首先请求 `/campaign/en/special-nav.plain.html`

#### Scenario: Localized sibling is the default

- **WHEN** 页面没有 `footer` 元数据
- **AND** 当前路径为 `/kz/ru/service`
- **THEN** 系统首先请求 `/kz/ru/footer.plain.html`

#### Scenario: Migration fallback is last

- **WHEN** localized nav 请求失败
- **AND** migration fallback 已启用
- **THEN** 系统随后请求 `/nav.plain.html`
- **AND** 系统不请求 `/site/nav`

### Requirement: Safe Metadata Override

系统 SHALL 只把同源 HTTP(S) URL 或以 `/` 开始的站内路径接受为 shell fragment override。

#### Scenario: Reject an unsafe scheme

- **WHEN** `nav` 元数据使用 `javascript:` 或 `data:` URL
- **THEN** 系统拒绝该 override
- **AND** 继续使用 localized sibling candidate

#### Scenario: Reject a cross-origin fragment

- **WHEN** `footer` 元数据指向另一个 origin
- **THEN** 系统不向该 origin 发送 fragment 请求
- **AND** 记录一次可诊断 warning

### Requirement: Shared Resolver

header 和 footer SHALL 使用同一 locale-root 和 candidate resolution contract，不得各自维护不同的市场/路径规则。

#### Scenario: Header and footer share context

- **WHEN** 当前页面解析为 `/uz/ru`
- **THEN** header 使用 `/uz/ru/nav`
- **AND** footer 使用 `/uz/ru/footer`
- **AND** 两者不包含硬编码的 Uzbekistan 分支逻辑

### Requirement: Dynamic Document Locale

系统 SHALL 根据安全页面元数据或当前 locale root 设置文档的 `lang` 和 `dir`，不得固定为 English。

#### Scenario: LTR language root

- **WHEN** 当前 locale root 的 language tag 为 `ru`
- **AND** 没有显式 language metadata override
- **THEN** `<html lang>` 为 `ru`
- **AND** `<html dir>` 为 `ltr`

#### Scenario: RTL language root

- **WHEN** 当前 locale root 的 language tag 为 `ar`
- **AND** metadata/BCP 47 技术规则推导 direction 为 `rtl`
- **THEN** `<html lang>` 为 `ar`
- **AND** `<html dir>` 为 `rtl`

#### Scenario: Directory direction mismatch

- **WHEN** eager 阶段初始 direction 与当前 locale option 的 `textDirection` 不一致
- **THEN** 系统记录配置 warning
- **AND** 系统使用经过验证的 authored direction 纠正文档属性

### Requirement: Non-Blocking Failure

shell fragment 无法取得或解析时，系统 SHALL 保持主体内容可用且不得抛出未处理异常。

#### Scenario: All nav candidates fail

- **WHEN** 所有 nav candidates 均返回非成功状态
- **THEN** header 保持为空或保留原语义 fallback
- **AND** main content 继续完成加载
- **AND** console 不出现未处理异常

#### Scenario: Footer fragment is malformed

- **WHEN** footer HTML 不满足最小内容契约
- **THEN** 系统不清空已取得的原始语义内容
- **AND** 记录一次可诊断 warning

### Requirement: Fragment Request Behavior

系统 SHALL 按 path 去重同一页面生命周期内正在进行的 fragment 请求，且失败响应不得被永久缓存。

#### Scenario: Concurrent request reuse

- **WHEN** 同一页面同时请求相同 `.plain.html` path 两次
- **THEN** 浏览器只发出一次进行中的网络请求
- **AND** 两个调用方接收同一结果

#### Scenario: Failed request can recover

- **WHEN** 第一次 fragment 请求失败
- **AND** 后续刷新或明确重试时该 path 已可用
- **THEN** 系统重新请求并可取得成功结果

### Requirement: Migration Fallback Retirement

根级 `/nav`、`/footer` fallback SHALL 由显式、可移除的 migration mechanism 控制，并在 localized cutover 验收后移除。

#### Scenario: Fallback disabled after retirement

- **WHEN** migration fallback 已关闭
- **AND** `/global/en/nav` 不可用
- **THEN** 系统不请求 `/nav`
- **AND** 系统按 non-blocking failure contract 降级

#### Scenario: No hidden legacy dependency

- **WHEN** 执行 legacy retirement audit
- **THEN** 代码和页面 metadata 中不存在 `/site/nav` 引用
- **AND** localized pages 中不存在依赖根级 `/nav` 或 `/footer` 的默认行为
