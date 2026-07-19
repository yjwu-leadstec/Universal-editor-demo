# Locale Directory Specification

## ADDED Requirements

### Requirement: Dedicated Localized Directory

每个语言根 SHALL 提供一个同级 `locale-directory` AEM 页面，内容通过 EDS fragment 交付并可独立发布。

#### Scenario: Directory follows the current locale root

- **WHEN** 当前页面 locale root 为 `/global/en`
- **THEN** 默认 directory path 为 `/global/en/locale-directory`

#### Scenario: Directory is independently published

- **WHEN** 作者只修改 locale directory
- **THEN** 发布该 directory page 即可更新选择器内容
- **AND** 不要求重新发布所有业务页面

### Requirement: Flat Authoring Model

locale directory SHALL 使用一个 container model 和重复的扁平 `locale-option` item，不得使用嵌套 multifield 表达 market → languages。

#### Scenario: Add an option in Universal Editor

- **WHEN** 作者在 locale-directory container 中添加一个语言选项
- **THEN** Universal Editor 只允许添加 `locale-option`
- **AND** 新 item 与其他 item 位于同一容器层级

#### Scenario: Reorder options

- **WHEN** 作者调整 locale-option 顺序
- **THEN** delivery 顺序和选择器展示顺序同步变化
- **AND** 不需要代码变更

### Requirement: Locale Option Fields

每个 `locale-option` SHALL 提供 `marketCode`、`marketLabel`、`languageTag`、`languageLabel`、`link`、`enabled` 和 `textDirection` 字段。

#### Scenario: Complete option renders

- **WHEN** option 字段有效且 `enabled=true`
- **THEN** 系统渲染使用 `languageLabel` 的真实 anchor
- **AND** anchor href 使用作者配置的 `link`
- **AND** anchor hreflang 使用 `languageTag`

#### Scenario: Disabled option is staged

- **WHEN** option 的 `enabled=false`
- **THEN** 该 option 不出现在交付选择器中
- **AND** 作者可保留它用于后续发布准备

### Requirement: Market Grouping

系统 SHALL 按连续 locale-option 的稳定 `marketCode` 分组，并使用该组一致的 `marketLabel`。

#### Scenario: Multiple languages in one market

- **WHEN** 两个连续 option 的 marketCode 都是 `kz`
- **AND** languageTag 分别是 `kk` 与 `ru`
- **THEN** 系统显示一个 Kazakhstan market row 和两个 language anchors

#### Scenario: Inconsistent market label

- **WHEN** 同一 marketCode 的 options 具有不同 marketLabel
- **THEN** 系统标记配置错误并只采用确定性值
- **AND** 记录一次可诊断 warning

#### Scenario: Non-contiguous market group

- **WHEN** 同一 marketCode 在其他 marketCode 之后再次出现
- **THEN** directory 未通过分组顺序校验
- **AND** 系统不合并跨越其他市场的非连续分组

### Requirement: Directory Validation

系统 SHALL 拒绝或跳过缺失 required field、重复 key、重复 normalized link 或非法 direction 的 enabled option。

#### Scenario: Duplicate option key

- **WHEN** 两个 enabled options 具有相同 `(marketCode, languageTag)`
- **THEN** 选择器只渲染第一条有效项
- **AND** 记录重复配置 warning

#### Scenario: Missing destination

- **WHEN** enabled option 没有 link
- **THEN** 系统不渲染该 option
- **AND** 系统不生成 `href="#"`

#### Scenario: Invalid text direction

- **WHEN** textDirection 不是 `ltr` 或 `rtl`
- **THEN** 该 enabled option 未通过配置校验

### Requirement: Readiness Gate

内部 locale destination SHALL 在 `enabled=true` 前通过 Preview 可用性检查。

#### Scenario: Enable a ready destination

- **WHEN** locale option 目标页面、nav、footer 和 locale-directory 在 Preview 均返回成功
- **THEN** release owner 可以将 option 设为 enabled

#### Scenario: Block an incomplete destination

- **WHEN** locale option 的目标或任一必要 shell fragment 返回 404
- **THEN** Preview release gate 失败
- **AND** option 保持 disabled

### Requirement: No Business Catalog in Code

前端代码 SHALL 不包含地区、语言、市场展示名或其业务 destination 的静态 catalog。

#### Scenario: Add a new market

- **WHEN** 作者添加有效并已发布的 `bh/ar` locale option
- **THEN** selector 可显示 Bahrain/Arabic
- **AND** 不需要修改 header JavaScript 常量

### Requirement: Current Locale State

系统 SHALL 通过规范化当前 locale root 与 option destination 标识当前语言，而不是依赖数组位置。

#### Scenario: Mark current locale

- **WHEN** 当前 page 位于 `/kz/ru`
- **AND** directory 中存在指向 `/kz/ru/homepage` 或其 locale root 的 option
- **THEN** 对应 anchor 具有 `aria-current="true"`

#### Scenario: No matching option

- **WHEN** 当前 locale root 没有匹配 option
- **THEN** 系统不错误标记第一项为当前项

### Requirement: Semantic Fallback

locale directory SHALL 交付可读的市场 labels 和真实 anchors；增强失败时仍保留最小可导航语义。

#### Scenario: JavaScript enhancement fails

- **WHEN** locale directory HTML 已取得但 dialog enhancement 失败
- **THEN** 用户仍可读取 enabled options 的 labels
- **AND** 用户仍可使用其真实 anchors 导航
