# Migration and validation evidence

Validated on 2026-07-24 against the requested Pencil nodes `YAfqr`, `pwCcp`,
`y6yvQ5`, `wakW8`, `SdaWn`, `krJ66`, `GWS95`, `y3Ggn7`, `aWsSv`, and `kicca`.

## Source and dialog

- Canonical block/model identity: `lixiang-product-detail-picture-group`.
- Canonical set marker: `lixiang-product-detail-picture-group-item`.
- Canonical media item: `lixiang-product-detail-picture-item`.
- Container dialog fields: id, desktop/tablet title, rich-text description,
  video controls, progress, motion, theme, spacing, and picture gap.
- Set dialog fields: key, title, and description.
- Media dialog fields: desktop/tablet image and alt, optional mobile image and
  alt, desktop/mobile video, caption, and caption detail.
- Generated component JSON and the EDS section allow-list contain the canonical
  identities; repository searches contain no legacy `picture-group` block or
  model identity.
- Deployed commits: `abafac6`, `e55028c`, `665d19b`, and `1043505`.

## AEM content migration

- Active page container:
  `/content/demo-site/language-master/en/li-l6/jcr:content/root/section/block-27-lixiang-product-detail-picture-group`.
- Aligned page uses the same canonical block structure.
- Backup page container:
  `/content/demo-site/language-master/en/li-l6-backup-20260721/jcr:content/root/section/block-05-lixiang-product-detail-picture-group`.
- Migrated totals: 3 containers, 4 set markers, and 20 media items.
- Active and aligned content serialize one set marker followed by eight direct
  media siblings. Backup content serializes two set markers with two media
  siblings per set.
- All migrated nodes carry canonical `model`, `modelFields`, and `nodename`
  metadata. The active `.plain.html` contains 15 block rows and all 8 pictures.
- The active Li L6 page was Quick Published after the final metadata migration;
  AEM confirmed that the page and its references were published.

## Visual and runtime verification

| Viewport | Measured picture grid | Result |
| --- | --- | --- |
| 1920px | 1479.99 × 1419.99px | Exact desktop mosaic; 8/8 images loaded; no overflow |
| 1440px | 1109.99 × 1064.99px | Proportional mosaic; 8/8 images loaded; no overflow |
| 1024px | 789.33 × 757.33px | Proportional mosaic; 8/8 images loaded; no overflow |
| 768px | 591.99 × 567.99px | Pencil tablet mosaic; 335.99px header; no overflow |
| 390px | 350 × 805.52px | Staggered mobile mosaic; header hidden; no overflow |

- The 1920px item geometry is 730×620, 730×460, two 355×300 items,
  730×460, two 355×460 items, and 730×460, matching the selected design.
- Universal Editor renders one canonical block, one set, eight editable media
  items, eight captions, and zero gray media fallbacks.
- All eight Author images complete at 978×550 using the verified Li Auto public
  originals when Author Dynamic Media delivery fails.
- Preview renders eight images and zero fallbacks at every checked breakpoint.
- Author and Preview contain zero component-originated console errors. The AEM
  shell continues to log unrelated Adobe `metricsRuntime` telemetry fetch
  failures; these do not originate from the page or block code.

## Automated checks

- `npm test`
- `npm run lint`
- `npm run build:json`
- `openspec validate refactor-product-detail-picture-group --strict`
- `git diff --check`
