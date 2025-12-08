# Change: Add Carousel Block

## Why
项目需要一个可视化轮播组件，用于展示多个 slides，每个 slide 可配置图片、标题和描述。这是常见的营销页面组件需求。

## What Changes
- 新增 `carousel` block，支持:
  - 多个 slides（>1）配置
  - 每个 slide 包含图片、标题、描述
  - 自动轮播功能（可配置间隔时间）
  - 底部圆点导航指示器
  - 无限循环播放
- 使用 lit-html 进行模板渲染
- 支持 Universal Editor 可视化编辑

## Impact
- Affected specs: 新增 `carousel` capability
- Affected code:
  - `blocks/carousel/carousel.js` - Block 主逻辑
  - `blocks/carousel/carousel.css` - 样式
  - `blocks/carousel/_carousel.json` - Universal Editor 模型
  - `models/_component-*.json` - 需运行 build:json 合并
