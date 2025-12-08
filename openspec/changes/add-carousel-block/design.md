# Design: Carousel Block

## Context
Carousel block 需要支持 Universal Editor 可视化编辑，遵循 AEM EDS 的 block/item 模式（类似 Cards）。

## Goals / Non-Goals
**Goals:**
- 支持多个 slides 的可视化编辑
- 配置自动轮播间隔时间
- 每个 slide 独立配置图片、标题、描述

**Non-Goals:**
- 不支持左右箭头导航（仅圆点）
- 不支持触摸滑动手势（第一版）

## Decisions

### Decision 1: 采用 Container + Item 模式
参考 Cards block 的实现模式：
- Carousel 作为容器，使用 `filter` 限制子组件
- Slide 作为子项，使用 `model` 定义字段

**Alternatives considered:**
- 单一 block 模式（所有 slides 在一个模型中）- 不够灵活，难以添加/删除 slide

### Decision 2: JSON 配置结构

#### `_carousel.json` 完整结构

```json
{
  "definitions": [
    {
      "title": "Carousel",
      "id": "carousel",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "Carousel",
              "model": "carousel",
              "filter": "carousel",
              "autoPlay": true,
              "autoPlayInterval": 5000,
              "loop": true,
              "transition": "slide"
            }
          }
        }
      }
    },
    {
      "title": "Slide",
      "id": "slide",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block/item",
            "template": {
              "name": "Slide",
              "model": "slide"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "carousel",
      "fields": [
        {
          "component": "boolean",
          "valueType": "boolean",
          "name": "autoPlay",
          "label": "Auto Play",
          "description": "Enable automatic slide advancement",
          "value": true
        },
        {
          "component": "number",
          "valueType": "number",
          "name": "autoPlayInterval",
          "label": "Auto-play Interval (ms)",
          "description": "Time between slide transitions in milliseconds",
          "value": 5000,
          "min": 1000,
          "max": 30000,
          "step": 500
        },
        {
          "component": "boolean",
          "valueType": "boolean",
          "name": "loop",
          "label": "Loop",
          "description": "Enable infinite loop (last slide connects to first)",
          "value": true
        },
        {
          "component": "select",
          "valueType": "string",
          "name": "transition",
          "label": "Transition Effect",
          "description": "Animation style for slide transitions",
          "value": "slide",
          "options": [
            { "name": "Slide", "value": "slide" },
            { "name": "Fade", "value": "fade" },
            { "name": "None", "value": "none" }
          ]
        }
      ]
    },
    {
      "id": "slide",
      "fields": [
        {
          "component": "reference",
          "valueType": "string",
          "name": "image",
          "label": "Slide Image",
          "description": "Background or main image for this slide",
          "multi": false
        },
        {
          "component": "text",
          "valueType": "string",
          "name": "imageAlt",
          "label": "Image Alt Text",
          "description": "Alternative text for accessibility",
          "value": ""
        },
        {
          "component": "richtext",
          "name": "text",
          "value": "",
          "label": "Text",
          "valueType": "string"
        },
        {
          "component": "aem-content",
          "valueType": "string",
          "name": "link",
          "label": "CTA Button Link",
          "description": "URL for the call-to-action button",
          "value": ""
        }
      ]
    }
  ],
  "filters": [
    {
      "id": "carousel",
      "components": [
        "slide"
      ]
    }
  ]
}
```

### Decision 3: Block HTML 结构

AEM 生成的原始 HTML 结构：
```html
<div class="carousel" data-aue-resource="..." data-aue-type="container">
  <!-- Slide 1 -->
  <div data-aue-resource="..." data-aue-type="component">
    <div><picture>...</picture></div>
    <div>Slide Title</div>
    <div>Slide Description</div>
  </div>
  <!-- Slide 2 -->
  <div data-aue-resource="..." data-aue-type="component">
    ...
  </div>
</div>
```

装饰后的 HTML 结构（lit-html 渲染）：
```html
<div class="carousel">
  <div class="carousel-slides-container">
    <div class="carousel-slide active" data-aue-resource="...">
      <div class="slide-image"><picture>...</picture></div>
      <div class="slide-content">
        <h2 class="slide-title">...</h2>
        <div class="slide-description">...</div>
      </div>
    </div>
    <!-- more slides -->
  </div>
  <div class="carousel-dots">
    <button class="carousel-dot active" data-index="0"></button>
    <button class="carousel-dot" data-index="1"></button>
  </div>
</div>
```

### Decision 4: 自动轮播实现
- 使用 `setInterval` 实现定时切换
- 鼠标 `mouseenter` 时 `clearInterval` 暂停
- 鼠标 `mouseleave` 时恢复 `setInterval`
- 仅当 slides > 1 时启用自动轮播

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 性能：大量 slides 导致 DOM 膨胀 | 建议限制 slides 数量（UI 提示） |
| 可访问性：自动轮播影响屏幕阅读器 | 添加 `aria-live="polite"` |
| 编辑体验：编辑时自动轮播干扰 | 检测 UE 编辑模式时禁用自动轮播 |

## Open Questions
- 无（CTA 按钮已纳入设计）
