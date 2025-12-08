# Tasks: Add Carousel Block

## 1. Universal Editor JSON 配置
- [x] 1.1 创建 `blocks/carousel/_carousel.json`
- [x] 1.2 配置 `definitions`: Carousel 容器（filter: carousel）
- [x] 1.3 配置 `definitions`: Slide 子项（model: slide）
- [x] 1.4 配置 `models.carousel`: autoPlay, autoPlayInterval, loop, transition 字段
- [x] 1.5 配置 `models.slide`: image, imageAlt, text, link 字段
- [x] 1.6 配置 `filters`: carousel filter 只允许 slide 组件

## 2. Block 基础结构
- [x] 2.1 创建 `blocks/carousel/carousel.js`（使用 lit-html）
- [x] 2.2 创建 `blocks/carousel/carousel.css` 基础样式

## 3. Slide 渲染逻辑
- [x] 3.1 实现 slide 数据提取（从 block children 读取）
- [x] 3.2 使用 lit-html `repeat` 渲染 slides 列表
- [x] 3.3 使用 `ref` + `moveInstrumentation` 保留 UE 编辑能力
- [x] 3.4 渲染 CTA 按钮（link 字段）

## 4. 导航功能
- [x] 4.1 渲染底部圆点导航指示器
- [x] 4.2 实现点击圆点切换 slide
- [x] 4.3 实现可配置的循环逻辑（读取 loop 属性）

## 5. 自动轮播
- [x] 5.1 读取 autoPlay 属性判断是否启用
- [x] 5.2 实现自动播放定时器（读取 autoPlayInterval）
- [x] 5.3 实现鼠标悬停暂停/恢复
- [x] 5.4 仅 slides > 1 时启用自动轮播

## 6. 过渡动画
- [x] 6.1 实现 slide 水平滑动过渡
- [x] 6.2 实现 fade 淡入淡出过渡
- [x] 6.3 支持 none 无动画模式
- [x] 6.4 根据 transition 属性切换动画类型

## 7. 样式完善
- [x] 7.1 响应式布局适配（移动端全宽）
- [x] 7.2 圆点导航样式（当前高亮）
- [x] 7.3 CTA 按钮样式

## 8. 验证
- [x] 8.1 运行 `npm run build:json` 合并 JSON 配置
- [x] 8.2 运行 `npm run lint` 验证代码规范
- [ ] 8.3 本地 `aem up` 测试渲染和交互
- [ ] 8.4 在 Universal Editor 中测试编辑功能
