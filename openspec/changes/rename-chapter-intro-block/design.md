## Context

The existing block already implements the approved full-screen Li L6 visual:
a 16:9 desktop media canvas, full-height capped mobile composition, overlaid
copy, responsive media, video controls, and Universal Editor instrumentation.
This change only establishes the correct canonical component identity and
rebuilds the six authored instances with a clean model.

## Goals / Non-Goals

- Goals:
  - Use `lixiang-product-full-screen-intro` as the only block/model name.
  - Preserve the current approved visual and responsive behavior.
  - Preserve all supported author fields and DAM references.
  - Remove carousel residue from the six Li L6 instances.
- Non-Goals:
  - Add new variants or fields.
  - Change shared media behavior.
  - Migrate unrelated components that are currently mis-authored.
  - Support existing `chapter-intro` markup after deployment.

## Visual and Responsive Requirements

- Desktop and tablet remain full-width 16:9 media with left-aligned overlaid
  eyebrow and title.
- At 1025–1440px and 720–1024px, the existing scaled copy geometry remains
  unchanged.
- At 719px and below, the component remains full-height with a 700–844px bound,
  mobile media override, and mobile title override.
- Universal Editor author mode must keep the component height bounded at the
  1006px editable iframe width and keep the component selectable.

## Content Model

The block remains a standalone model. Authors keep the fields:
`id`, `eyebrow`, `title`, `mobileTitle`, `description`, `note`, `image`,
`imageAlt`, `mobileImage`, `mobileImageAlt`, `video`, `mobileVideo`,
`fullVideo`, `playLabel`, `loop`, `showVideoControl`, `showProgress`, and
`classes`.

The default style remains:
`dark`, `light-copy`, `bottom-copy`, `left-copy`.

## Decisions

- Rename every block-specific selector and generated DOM class so the old
  namespace is absent from runtime code.
- Keep shared `.product-media` classes unchanged because they are owned by the
  shared media utility, not this block.
- Preserve the six JCR sibling positions by renaming each existing node in
  place, then replace its model metadata and remove obsolete child slide nodes
  and carousel-only properties.
- Do not add a loader alias or duplicate block directory.

## Li L6 Content Mapping

| Existing node | Replacement node |
| --- | --- |
| `block-03-chapter-intro` | `block-03-lixiang-product-full-screen-intro` |
| `block-05-chapter-intro` | `block-05-lixiang-product-full-screen-intro` |
| `block-12-chapter-intro` | `block-12-lixiang-product-full-screen-intro` |
| `block-15-chapter-intro` | `block-15-lixiang-product-full-screen-intro` |
| `block-20-chapter-intro` | `block-20-lixiang-product-full-screen-intro` |
| `block-24-chapter-intro` | `block-24-lixiang-product-full-screen-intro` |

## Risks / Trade-offs

- Existing unpublished `chapter-intro` content will stop loading by design.
- AEM content must change only after the renamed block and model reach remote
  `main`; otherwise the author canvas briefly has no matching implementation.
- The shared sandbox can still block Edge preview refresh if its author delivery
  endpoint returns 401; Author canvas verification remains mandatory.

## Migration Plan

1. Rename and validate the code/model namespace.
2. Push the exact commit to remote `main`.
3. Rename the six JCR nodes in place.
4. Set the new model/name/model field metadata.
5. Remove obsolete carousel properties and nested slide items.
6. Publish and verify Author plus Preview at required breakpoints.

Rollback requires reverting the code commit, restoring the six old node names
and `chapter-intro` model metadata, and restoring any removed child slide only
if the old carousel residue is intentionally needed.
