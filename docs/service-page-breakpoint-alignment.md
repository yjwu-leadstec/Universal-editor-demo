# Service 页面组件官网对齐验收

## 事实来源

- 官网：`https://www.liauto.com/support/service`。
- 官网样式表：`static-eu.liauto.com/fed/fed-liauto-web/chunk-2606/css/support/common/index.*.css`。
- 本项目页面：`/content/demo-site/language-master/en/service`，交付地址
  `https://main--universal-editor-demo--yjwu-leadstec.aem.page/language-master/en/service`。
- 涉及 block：`service-hero`、`service-feature-panel`（`list` / `app` / `diagnosis` 三个变体）。

## 命名对照（block 名与模型名不一致）

Block 目录是 `service-*`，但 Universal Editor 模型 id、运行时 class 和官网场景名各不相同。改动前先对齐这张表，
否则会在错误的选择器上改样式：

| 本项目 block | UE 模型 id | 运行时 class 前缀 | 官网场景 class |
| --- | --- | --- | --- |
| `service-hero` | `support-hero` | `.support-hero-*` | `.sceneservicehome` |
| `service-feature-panel`（`list`） | `support-feature-panel` / `support-feature-item` | `.support-feature-*` | `.sceneserviceservice2` |
| `service-feature-panel`（`app` / `diagnosis`） | 同上 | `.support-feature-*` | `.sceneserviceservice1` |

`support-*` 只是模型与 class 的历史命名，`blocks/support-*/` 目录已不存在；不要据此新建 block 目录。

## 断点模型（与全站三档不同）

官网 service 页**不使用**全站的 `1441 / 720-1440 / 719` 三档，而是**单断点 + rem 流式缩放**：

- 唯一的布局断点是 `720px`（桌面 / 移动切换）。
- 桌面侧尺寸由官网 `html { font-size }` 阶梯连续缩放：`>1440px` 为 `112px`，`1025–1440px` 为 `84px`，
  `<=1024px` 为 `8.3333vw`。`1440` 与 `1024` 只改变缩放系数，**不改变布局结构**。
- 本项目用 `--service-rem` / `--service-unit` 复刻该阶梯，桌面所有尺寸写成
  `calc(<1920px 下的 px 值> * var(--service-unit))`，因此 CSS 里的字面量可直接当作官网 1920px 设计值阅读。

这与 `AGENTS.md`「Header 响应式强制规则」里的全站三档不冲突：三档描述的是全站布局层，本页是组件级缩放模型，
不得据此把 `1440 / 1024` 解释成新的全站断点。

## 全出血写法（不要用 `100vw`）

两个 block 都是全出血。**不得**使用 `width: 100vw` + `margin-inline: calc(50% - 50vw)`：`100vw` 含滚动条宽度，
桌面端会把整个 block 左移约 `7.5px`（1920px 视口下 block 宽 1920 而可用宽仅 1905）。

正确做法是消解 section wrapper 的宽度限制：

```css
main .section > .service-hero-wrapper {
  max-width: none;
  padding: 0;
}
```

水平留白改由 block 内部的 `.support-feature-shell`（`box-sizing: border-box` + `max-width: 1920px`）承担，
与官网把 gutter 挂在 1920 容器上的做法一致。

## 已验证基准值

以下为 1920px 下的官网值，其余宽度按 `--service-unit` 连续缩放：

- Hero：eyebrow `24/32px`、padding-top `176px`；标题 `64/84px`、下边距 `32px`；描述 `16/24px`、左右 `384px`、
  下边距 `80px`；媒体高 `32.29vw`，上限 `620px`。
- Feature panel：shell 左右 `160px`；段标题 `48/60px`、上下 `120/56px`；双列 `1fr 1fr`；
  copy 列 `80/114/0/124px`；items 列 `120/124/120/10px`；条目标题 `24/32px`，正文 `16/28px`；
  媒体 `28.22vw × 19.79vw`，上限 `562 × 380px`。
- `<=720px`：全部改用固定 px。Hero 标题 `36/48px`、左右 `40px`；面板 shell `0 20px 20px`，
  `list` 变体额外 `padding-top: 80px`；面板转单列，媒体经 `order: -1` 置于文案之上，
  `app` / `diagnosis` 媒体高 `calc(56.12vw - 22.448px)`，`list` 媒体高 `50.13vw`。

## 回归标准

- 在 `1920 / 1600 / 1441 / 1440 / 1200 / 1025 / 1024 / 900 / 800 / 721 / 720 / 600 / 390px` 逐档比对
  x 坐标、宽度、字号、行高；`1920–721` 应与官网逐值一致。
- 断点两侧的临界值必须成对验证：`1441/1440`、`1025/1024`、`721/720`。
- Universal Editor 画布同样要验：4 个 block 全部渲染，18 个 `data-aue-prop` 字段无一被隐藏或塌陷为零尺寸，
  集合项数量为 `4 / 2 / 2`，内容树标签正确（不得退化成 `Property`）。画布默认宽度受属性面板挤压（约 `394px`），
  需关闭属性面板才能验证桌面双列；验证后恢复面板。
- 无 `.block-error`、控制台错误或页面级横向滚动。

## 已知的官网自身缺陷（不要跟随）

- `<=720px` 时官网 `app` 变体媒体用 `calc(100vw - 40px)`，把滚动条算了进去，实测 `680px`；
  同位置的 `list` 变体是 `100%`（`665px`）。`665px` 才是设计意图，本项目两个变体都用 `100%`，
  与官网存在 `15px` 差异属**预期**。
- 官网 `.sceneserviceservice2-desc` 在移动端是 shrink-to-fit 的 flex 项，实测宽度随文案变化；
  本项目使用块级全宽，不复制该行为。
