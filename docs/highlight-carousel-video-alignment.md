# Highlight Carousel video alignment

> 注：该组件 2026-07-24 已改名为 `lixiang-product-intro-slider`（曾用名 highlight-carousel），代码在 `blocks/lixiang-product-intro-slider/`。本文档记录历史阶段的对齐工作，正文名称按历史保留。

## Design evidence

- Pencil states that carousel media can be an image or a looping video.
- Video uses one configurable play/pause control at the upper right.
- The control can expose a configurable progress indicator.
- Video completion must not advance the carousel or the next chapter.
- The supplied reference shows a dark translucent circular control with a thin outer progress ring.

## Acceptance criteria

- Video and image slides use the same media box, crop, radius, and responsive geometry.
- A visible video starts muted, loops in place, and pauses after an explicit user pause.
- The button exposes `Play video` or `Pause video` to assistive technology.
- The icon is CSS geometry rather than a font glyph, so it remains centered across platforms.
- The progress indicator is a thin outer ring; it never fills the button as a conic sector.
- `Show Video Control` hides the whole control when disabled.
- `Show Video Progress` removes only the progress ring when disabled.
- Reduced-motion preference disables automatic playback.
- A video `ended` event does not change the active carousel slide.

## Authoring impact

No dialog or content-model change is required. The existing `video`, `mobileVideo`, `showVideoControl`, and `showProgress` fields cover the design.
