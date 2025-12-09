# carousel Specification

## Purpose
TBD - created by archiving change add-carousel-block. Update Purpose after archive.
## Requirements
### Requirement: Component Definition
系统 SHALL 在 `_carousel.json` 中定义 Carousel 和 Slide 两个组件。

#### Scenario: Carousel 容器定义
- **WHEN** 定义 Carousel 组件
- **THEN** 使用 `resourceType: "core/franklin/components/block/v1/block"`
- **AND** 配置 `filter: "carousel"` 限制子组件类型
- **AND** 配置 `model: "carousel"` 关联容器模型

#### Scenario: Slide 子项定义
- **WHEN** 定义 Slide 组件
- **THEN** 使用 `resourceType: "core/franklin/components/block/v1/block/item"`
- **AND** 配置 `model: "slide"` 关联 slide 字段模型

### Requirement: Component Models
系统 SHALL 定义 carousel 和 slide 两个 model。

#### Scenario: Carousel 模型字段
- **WHEN** 定义 carousel model
- **THEN** 包含以下字段：
  - `autoPlay` (boolean): 是否自动播放，默认 true
  - `autoPlayInterval` (number): 自动播放间隔，默认 5000ms
  - `loop` (boolean): 是否无限循环，默认 true
  - `transition` (select): 过渡动画类型（slide/fade/none），默认 slide

#### Scenario: Slide 模型字段
- **WHEN** 定义 slide model
- **THEN** 包含以下字段：
  - `image` (reference): Slide 图片
  - `imageAlt` (text): 图片替代文本
  - `text` (richtext): Slide 文本内容（可包含标题和描述）
  - `link` (aem-content): CTA 按钮链接

### Requirement: Component Filter
系统 SHALL 定义 carousel filter 限制可添加的子组件。

#### Scenario: Filter 配置
- **WHEN** 配置 carousel filter
- **THEN** `components` 数组只包含 `"slide"`
- **AND** 禁止向 carousel 中添加其他类型组件

### Requirement: Carousel Container
系统 SHALL 提供一个 carousel block 容器，用于包含多个 slides。

#### Scenario: Carousel 渲染
- **WHEN** 页面包含 carousel block
- **THEN** 系统渲染 carousel 容器，显示当前活动的 slide

#### Scenario: 最少 Slide 数量
- **WHEN** carousel 只有 1 个 slide
- **THEN** 隐藏导航圆点，禁用自动轮播

### Requirement: Slide Content
每个 slide SHALL 支持配置图片、文本内容和链接。

#### Scenario: 完整 Slide 渲染
- **WHEN** slide 配置了图片、文本和链接
- **THEN** 按顺序渲染图片、文本内容、CTA 按钮

#### Scenario: 部分字段渲染
- **WHEN** slide 只配置了部分字段（如只有图片）
- **THEN** 只渲染已配置的字段，不显示空占位

### Requirement: Auto-play
Carousel SHALL 支持可配置的自动轮播功能。

#### Scenario: 自动播放启动
- **WHEN** `autoPlay` 为 true 且 carousel 有 >1 个 slides
- **THEN** 自动开始轮播，按 `autoPlayInterval` 间隔切换

#### Scenario: 自动播放禁用
- **WHEN** `autoPlay` 为 false
- **THEN** 不自动切换 slide，仅支持手动导航

#### Scenario: 鼠标悬停暂停
- **WHEN** 用户鼠标悬停在 carousel 上
- **THEN** 暂停自动轮播
- **AND** 鼠标移开后恢复自动轮播

### Requirement: Dot Navigation
Carousel SHALL 显示底部圆点导航指示器。

#### Scenario: 圆点渲染
- **WHEN** carousel 有 N 个 slides（N > 1）
- **THEN** 显示 N 个圆点，当前 slide 对应的圆点高亮

#### Scenario: 点击导航
- **WHEN** 用户点击某个圆点
- **THEN** 切换到对应的 slide
- **AND** 更新圆点高亮状态

### Requirement: Infinite Loop
Carousel SHALL 支持可配置的无限循环播放。

#### Scenario: 正向循环
- **WHEN** `loop` 为 true 且当前显示最后一个 slide
- **AND** 切换到下一个
- **THEN** 显示第一个 slide

#### Scenario: 循环禁用
- **WHEN** `loop` 为 false 且当前显示最后一个 slide
- **THEN** 停止自动播放，禁用"下一个"导航

#### Scenario: 快速定位
- **WHEN** 用户点击任意圆点导航
- **THEN** 直接跳转到对应 slide

### Requirement: Transition Effects
Carousel SHALL 支持多种过渡动画效果。

#### Scenario: Slide 过渡
- **WHEN** `transition` 为 "slide"
- **THEN** slides 水平滑动切换

#### Scenario: Fade 过渡
- **WHEN** `transition` 为 "fade"
- **THEN** slides 淡入淡出切换

#### Scenario: 无过渡
- **WHEN** `transition` 为 "none"
- **THEN** slides 立即切换，无动画

### Requirement: CTA Button
每个 Slide SHALL 支持可选的 CTA 按钮链接。

#### Scenario: CTA 按钮渲染
- **WHEN** slide 配置了 `link` 字段
- **THEN** 在 slide 内容区域显示按钮链接

#### Scenario: CTA 按钮隐藏
- **WHEN** slide 未配置 `link` 字段
- **THEN** 不显示 CTA 按钮

### Requirement: Universal Editor Integration
Carousel block SHALL 支持 Universal Editor 可视化编辑。

#### Scenario: 编辑 Slide 内容
- **WHEN** 在 Universal Editor 中选中 carousel
- **THEN** 可直接编辑每个 slide 的图片、标题、描述

#### Scenario: 添加/删除 Slide
- **WHEN** 在 Universal Editor 中操作 carousel
- **THEN** 可添加新 slide 或删除现有 slide

### Requirement: lit-html Rendering
Carousel block SHALL 使用 lit-html 进行模板渲染。

#### Scenario: 模板渲染
- **WHEN** block decorate 函数执行
- **THEN** 使用 lit-html `render` 函数渲染模板
- **AND** 使用 `repeat` directive 渲染 slides 列表
- **AND** 使用 `ref` directive 获取需要 instrumentation 的元素

### Requirement: Responsive Design
Carousel SHALL 支持响应式布局。

#### Scenario: 移动端适配
- **WHEN** 屏幕宽度 < 768px
- **THEN** carousel 占满容器宽度
- **AND** 图片等比例缩放

