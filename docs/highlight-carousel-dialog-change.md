# Highlight Carousel Dialog Change

## Scope

Update the existing `highlight-carousel` authoring model without changing its
circular carousel behavior. Existing L6 content at
`/language-master/en/li-l6` is the regression fixture.

## Acceptance criteria

### Author experience

- Component and mobile titles use multiline author inputs and retain manual line breaks.
- Card titles use multiline author inputs; descriptions remain rich text.
- Authors choose the section background from White `#FFFFFF`, Black `#000000`, or Gray `#FAFAFA`.
- Authors choose desktop card copy from White `#FFFFFF` or Black `#191919` per card.
- Authors can optionally override the section heading color with the same white/black choices.
- Spacing remains a semantic Large/Small/None choice and resolves to PC `160/80/0px` and mobile `80/60/0px`; Small is the default.
- Notes have an explicit visibility checkbox while existing authored notes remain visible until explicitly disabled.
- Each card can provide an optional multiline indicator label and the indicator color remains configurable.
- Video controls and their progress ring are independently configurable at component level.

### Runtime behavior

- Empty title, description, note, and indicator fields do not create visible placeholders.
- Manual title line breaks render on desktop and mobile without overflow.
- Mobile remains manual horizontal scrolling with no autoplay.
- Mobile cards stretch to the tallest card copy instead of using a fixed content height.
- Existing unlabeled L6 indicators retain their compact presentation.
- Existing circular order, autoplay interval, and wraparound behavior do not change.

### Compatibility

- New scalar fields are appended after existing published fields so legacy positional markup is not shifted.
- Missing `showNote` falls back to showing an existing non-empty note.
- Missing copy/heading color fields preserve the existing theme behavior.
- Universal Editor instrumentation remains available for all rendered fields.

## Content model

### `highlight-carousel`

Existing fields remain. `title` and `mobileTitle` become multiline inputs.
New optional fields are `headingColor` and `showVideoControl`; the existing
`showProgress` field is clarified as video progress.

### `highlight-slide`

Existing media, copy, metrics, and link fields remain. `title` and `note`
become multiline inputs. New optional fields are `copyColor`, `showNote`, and
`indicatorLabel`.
