# Li L6 Figma component audit

## Purpose and source priority

This audit defines the implementation baseline for rebuilding the Li L6 page from the
`Liauto` Figma file, node `52:887`.

The Figma connector could not return structured design context. Per the project owner's
direction, the synchronized Pencil source is now the primary structured design source.

Source priority for the released page is:

1. The current public `https://www.liauto.com/L6` page for page inventory, copy,
   media, and runtime behavior.
2. `lixiang2/docs/pencil/Li-L6/Li-L6.pen`, read only through Pencil MCP.
3. Figma component descriptions, screenshots, and the complete Li L6 composition at
   node `52:887`, used as the visual cross-check for the synchronized Pencil source.
4. Existing `Universal-editor-demo` blocks and AEM content models, reused where they
   match the Figma intent.
5. `lixiang2` and EDS reference material only for real copy/media and behavior that is
   not defined by Figma.

The EDS reference must not add visual component families or page sections that are not
supported by the Figma design.

## Confirmed Figma component families

The canvas explicitly numbers and describes eight visual component families.

| # | Figma component | Final EDS mapping | Rebuilt Li L6 usage | Audit result |
| --- | --- | --- | ---: | --- |
| 1 | 介绍页首屏 | `product-hero` | 2 | The Pencil opening hero is reused, and the current public page's second image-only configuration hero is retained after the 28-block story. |
| 2 | 亮点轮播 | `lixiang-highlight-carousel` | 1 | Realigned to the 1200×674 desktop center card with adjacent cards, circular controls, nested statistics, and manual mobile scroller. |
| 3 | 内容展示 | `lixiang-product-intro-carousel` | 10 | Reused for one gray, one large, and eight compact content-display sections. Single-item sections no longer render an empty tab strip. |
| 4 | 图上切换 | `image-switcher` | 6 | Split into a first-class block with image/video panels, manual switching, four-second autoplay, accent/indicator settings, and mobile tabs. |
| 5 | 大小图 | `big-small-gallery` | 2 | Split into a first-class block with one large plus two small desktop cards and a mobile stack. |
| 6 | 单图－图上字 | `chapter-intro` | 6 | Reused for the six full-bleed chapter media sections in the composed page. |
| 7 | 多图 | `picture-group` | 1 | Rebuilt as the fixed desktop/mobile mosaic with scroll-linked image movement. |
| 8 | 结尾总结 | `feature-grid` | 1 | Rebuilt with nested groups, three columns on desktop, and two-row horizontal groups on mobile. |

The previous local Li L6 fixture contained 21 visual block instances across 11 block
types:

| Current block | Instances |
| --- | ---: |
| `product-hero` | 2 |
| `product-sticky-nav` | 1 |
| `lixiang-highlight-carousel` | 1 |
| `chapter-intro` | 5 |
| `lixiang-product-intro-carousel` | 5 |
| `picture-group` | 1 |
| `spec-table` | 2 |
| `product-ending` | 1 |
| `product-guide` | 1 |
| `product-download` | 1 |
| `product-notes` | 1 |

The Figma descriptions do not define `product-sticky-nav`, the second product hero,
the two specification tables, product ending CTA, guide, download, or notes as Li L6
visual component families. These blocks may remain reusable elsewhere in the project,
but their presence on the rebuilt L6 page requires direct evidence from the Figma page
composition. EDS reference presence alone is insufficient.

Pencil MCP exposes the complete marketing story as `PC-L6` (`dlsUO`). Its 28
direct visual children are one hero (`VrkQC`), one highlight carousel (`SfXro`), six
full-bleed chapter media frames (`E68sS`, `g6U8NX`, `rjIPi`, `KrRoj`, `AGSsY`,
`VIx3g`), and `T&P 1` through `T&P 20`. The rebuilt fixture follows that exact
28-block sequence, then retains the current public page's sticky navigation and visible
detail tail: the second image-only hero, three-tab Smart Space/AD specification table,
ending CTA, mobile guide, and delivered-vehicle note. This produces 34 rendered blocks.
The current source-only share metadata remains page metadata; the empty download and
power source instances do not create invented visual sections.

## Shared Figma rules

These rules recur across the component descriptions and should become shared product
block behavior rather than one-off CSS:

- Desktop spacing choices: `160px`, `80px`, or none; default `80px` unless the family
  explicitly selects the larger spacing.
- Mobile spacing choices: `80px`, `60px`, or none; default `60px`.
- Background choices: white `#fff`, black `#000`, and gray `#fafafa` where listed.
- Copy choices: white `#fff` or dark `#191919`, selected for the authored media.
- Desktop and mobile primary headings support independent manual line breaks.
- Empty optional headings, descriptions, notes, cards, and copy groups collapse without
  blank shells.
- Video-capable components loop muted preview media and use a consistent top-right
  play/pause control with an optional progress indicator.
- Autoplay switchers use a four-second interval where specified and always retain manual
  switching.
- Image ratios offered by content display are `16:9`, `2.35:1`, and `4:3`.
- When cards contain optional notes or different copy lengths, all cards align to the
  tallest authored card.

## Component requirements transcribed from Figma

### 1. 介绍页首屏

- No design change is requested; the existing hero component can be reused.
- Reuse still requires one-to-one validation against the opening hero in the composed
  Figma page at desktop and mobile sizes.

### 2. 亮点轮播

Desktop:

- The primary heading supports a manual line break independently from mobile.
- Copy color is white or `#191919`; background is white, black, or `#fafafa`.
- Spacing options are `160px`, `80px`, and none; default `80px`.
- Card title/body/note are optional and support manual line breaks.
- Optional notes make every card use the same final height as the noted card.
- The active item is centered, the next item is on the right, and the last item is on
  the left, forming a circular sequence.
- The carousel does not automatically scroll into the next page chapter after playback.
- Image and video cards share a top-right play/pause control with configurable progress.

Mobile:

- Spacing options are `80px`, `60px`, and none; default `60px`.
- Long card copy wraps at the defined content width.
- All cards use the height of the longest card, including optional notes.
- There is no autoplay; users switch cards by horizontal scrolling.

### 3. 内容展示

- Media may be image or looping video with play/pause.
- Primary headings and explanatory copy support independent manual line breaks.
- Optional secondary content can be hidden without leaving layout gaps.
- Copy color is white or `#191919`; background is white, black, or `#fafafa`.
- Desktop spacing is `160px`, `80px`, or none; default `80px`.
- The gold title rule follows the title width.
- Indicator color is configurable and its minimum width is `98px`.
- Media ratios are `16:9`, `2.35:1`, and `4:3`.
- Card background is independently configurable.
- The switcher supports four-second autoplay and manual selection.
- The authored collection contains three to four cards.
- Media and its card strip visually join: top media corners and bottom card corners use
  `4px` radii.
- Video uses the shared top-right play/pause/progress control.
- Mobile spacing is `80px`, `60px`, or none; default `60px`.

### 4. 图上切换

- Media may be image or looping video with play/pause.
- The primary heading supports manual line breaks.
- Gold/accent copy color is configurable.
- Two vertical-spacing choices are available; the larger bottom spacing is the default.
- Indicator color is configurable.
- Four-second automatic switching and manual switching are both required.

### 5. 大小图

- Desktop background is white or `#fafafa`.
- Mobile may inherit desktop background or use a separately authored choice.
- Heading/copy above the image composition follows the shared typography and spacing.
- Desktop and mobile images are authored independently.
- Media preserves its authored proportions.
- Two vertical-spacing choices are available; the larger spacing is the default and
  desktop/mobile spacing can be configured independently.

### 6. 单图－图上字

- Two vertical-spacing choices are available; the larger spacing is the default.
- Overlay copy backgrounds can be configured independently for dark/light media.
- Section background is white, black, or `#fafafa`; copy is white or `#191919`.
- Empty copy fields are omitted.
- Primary headings support independent desktop/mobile line breaks.
- Copy reveal animation is optional and enabled by default.
- Up to four explanatory copy groups are supported.
- Video uses the shared top-right play/pause/progress control.

### 7. 多图

- The distance between explanatory copy and images has two choices; the larger spacing
  is the default.
- The primary heading supports manual line breaks.
- Two overall vertical-spacing choices are available; the larger is the default.
- Each media item can be image or video.
- Background is white or gray.
- Video items use an image-like fixed frame. The annotated frame ratio is `1.4` (for
  example, `730×1022` or `620×868`).

### 8. 结尾总结

Desktop:

- Primary heading and explanatory copy support manual line breaks; desktop and mobile
  heading breaks are independent.
- Optional secondary content can be hidden without layout gaps.
- Copy color is white or `#191919`; background is white, black, or `#fafafa`.
- Spacing is `160px`, `80px`, or none; default `80px`.
- Card title/body are optional and support manual line breaks.
- Notes are optional.

Mobile:

- Content rules match desktop.
- Spacing is `80px`, `60px`, or none; default `60px`.

## Implementation result

All eight families were read through Pencil MCP and mapped before code changes. The
runtime, CSS, Universal Editor models/definitions/filters, and authored L6 fixture were
then updated together. Existing instrumentation is preserved through the shared product
block utilities and `moveInstrumentation()`/item instrumentation paths.

The final fixture was exercised at `1920`, `1440`, `1024`, and `390` pixels. It renders
all 34 authored blocks with no document-level horizontal overflow or console error.
The current-source mobile-only guide is intentionally hidden at desktop breakpoints;
hidden inactive switcher panels are the only other intentionally zero-sized media nodes.
