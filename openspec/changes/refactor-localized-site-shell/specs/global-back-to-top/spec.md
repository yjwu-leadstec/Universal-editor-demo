## ADDED Requirements

### Requirement: Global Back-to-Top Control

站点 SHALL 在所有页面自动加载独立的 `lixiang-back-to-top` control，且其可用性不得依赖
footer fragment 是否含 `#top` link。

#### Scenario: Hidden at the top

- **WHEN** 页面滚动位置小于 100px
- **THEN** back-to-top control 不可见且不可通过键盘聚焦

#### Scenario: Visible after the live-site threshold

- **WHEN** 页面滚动位置达到或超过 100px
- **THEN** back-to-top control 可见并可通过键盘聚焦

#### Scenario: Return immediately to the top

- **WHEN** 用户激活 back-to-top control
- **THEN** 页面立即滚动到顶部
- **AND** 不使用平滑滚动动画

### Requirement: Live-Site Positioning

back-to-top control SHALL 匹配现网桌面和移动端的尺寸与固定间距，并在 footer 进入视口时
上移，避免覆盖 footer 内容。

#### Scenario: Desktop viewport

- **WHEN** viewport 宽度至少为 720px
- **THEN** control 为 48px 圆形按钮
- **AND** 默认距离右侧和底部均为 40px

#### Scenario: Mobile viewport

- **WHEN** viewport 宽度小于 720px
- **THEN** control 为 40px 圆形按钮
- **AND** 默认距离右侧 16px、底部 28px

#### Scenario: Footer enters the viewport

- **WHEN** footer 顶部进入 control 的固定区域
- **THEN** control 自动上移
- **AND** control 与 footer 顶部保留当前 viewport 对应的默认底部间距

### Requirement: Accessible Name

back-to-top control SHALL 使用语义化 `button`，并提供可访问名称。

#### Scenario: Localized metadata exists

- **WHEN** 页面提供 `back-to-top-label` metadata
- **THEN** control 使用该 metadata 值作为 accessible name

#### Scenario: Global English fallback

- **WHEN** 页面未提供 `back-to-top-label` metadata
- **THEN** control 使用 `Back to top` 作为 accessible name
