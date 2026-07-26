# lixiang-product-intro-slider 轮播架构

面向下一个要改这个组件的人。代码在 `blocks/lixiang-product-intro-slider/`。

## 一句话

**整条轨道做一次位移，而不是每张卡各自定位。** 卡片并排成一条 flex 带子，
切换时只改轨道上的一个 `transform`。

## 为什么不是三槽位方案

早期实现给每张卡片单独定位到 previous / active / next 三个槽位，切换时每张卡
各自补间到新槽位。问题：进入的卡片从槽位边缘"长"出来，视觉上和其他卡片**方向相反**——
用户看到的现象是"左移时中间的卡片在往右动"。

主流库（Swiper / Slick）都是单轨道位移。已改为这个方案，不要改回去。

## 关键机制

### 1. 单一 transform 驱动

```
.highlight-track {
  display: flex;
  width: max-content;
  transform: translateX(calc(50cqw - var(--highlight-step) / 2
                        - var(--active-slide, 0) * var(--highlight-step)));
}
```

- `--active-slide` 由 JS 设置，是卡片在**含克隆的带子**里的位置
- `--highlight-step` 是一格的宽度，各断点不同（见下）
- 逐帧验证过：所有卡片每一帧位移量完全一致、方向相同

### 2. 每格宽度是变量，不是百分比

轨道含克隆后比一张卡宽得多，`100%` 会变成整条带子的百分比。所以用
`--highlight-step`，各断点各自声明：

| 断点 | `--highlight-step` | 卡片宽 | 邻卡露出 |
| --- | --- | --- | --- |
| ≥1441px | 1240px | 1200px | 320px |
| 1025–1440px | 940px | 900px | 110px |
| 721–1024px | 670px | 630px | 75px |
| ≤720px | 不适用 | 100vw | 原生滚动 |

改任一断点的卡片宽度时，**必须同时改该断点的 `--highlight-step`**，否则步长和卡宽脱节。

### 3. 居中靠容器单位，不能用 margin auto 或 left

带子远宽于视口，`margin-inline: auto` 无可分配空间，会把第一张卡钉在左边缘。

也**不能**用 `left: 50%`——`.highlight-viewport` 自身已经用 `left: 50%` +
`margin-inline-start: -50vw` 做了满宽突破，轨道再用一次会叠加两次，整条带子跑偏。

正确做法：viewport 声明 `container-type: inline-size`，轨道用 `50cqw` 对着
**裁剪框本身**居中。这样各断点都成立，不依赖 100vw。

### 4. 循环靠边缘克隆

线性带子两端外面什么都没有：第 1 张卡左边空白，且从第 1 张往回翻会横扫整条轨道。

做法同 Swiper 的 `loop: true`：
- 末尾若干张克隆到最前，开头若干张克隆到最后
- 走到克隆片后，关掉 transition **瞬间**跳到对应的真实卡片
- 因为克隆和原片是同一张图，跳变不可见

**`CLONE_DEPTH = 2`，每边 2 张，不是 1 张。** 设计上左右各露一角（同屏可见 3 张），
所以轨道滑到边缘克隆片上时，**克隆片再外侧那一格也在屏幕内**。每边只有 1 张克隆时
那一格是空的，实测有 10 帧、最大 358px 的空白持续约 180ms，表现为"下一张慢一拍才出现"。

> **规则：`CLONE_DEPTH` 必须 ≥ 可见邻卡数 + 1。** 如果以后设计改成同屏露出更多卡片，
> 这个常量要跟着调大。

克隆片是装饰性副本，创建时会剥掉：
- `data-aue-*` / `data-richtext-*` —— 否则 Universal Editor 会看到重复字段
- `<video>` 和播放控件 —— 否则浏览器重复解码同一个视频
- `id` 属性 —— 否则 DOM 里出现重复 id

### 5. 移动端走原生滚动，必须重置桌面端样式

移动端不用步进，用原生 scroll-snap。桌面端的 `transform` 若不清掉，会把整条带子
推到屏幕外（实测偏移 10000px 而 `scrollLeft` 仍是 0，轮播整个空白）。

移动端断点里必须有：
- `transform: none` —— 否则空白
- `.highlight-slide.is-clone { display: none }` —— 否则滑动序列里出现重复卡片

## 验证方式

本地 fixture 测不出层叠问题（真实页面上其他 product 组件会注入
`styles/product-blocks.css`）。必须按 `CLAUDE.md` 的要求在环境上验证：

`https://main--universal-editor-demo--yjwu-leadstec.aem.page/language-master/en/li-l6`

逐帧检查动效的判据：
- 每一帧所有卡片位移量相同、方向相同
- 环绕全程视口两侧不出现空白（注意：卡片间 40px 间距扫过边缘时会有 ~33px 的正常间隙，
  普通切换也有，不算缺陷）
- 移动端克隆片隐藏、`transform: none`、滚动宽度等于真实卡片数

## 注意

这个组件是**自包含**的（见 `CLAUDE.md` 的 Atomic Development）：它用自己的
`slider-utils.js` 和自己的 `product-*` CSS，不引用 `scripts/product-block-utils.js`
和 `styles/product-blocks.css`。共享文件的修复**不会**惠及它。
