# All-New Li L9 content mapping

## Scope and source of truth

- Production source checked on 2026-07-27: `https://www.liauto.com/l9`
- AEM page: `/content/demo-site/language-master/en/li-l9`
- EDS route: `/language-master/en/li-l9`
- Content alignment covers all 31 ordered production scenes, their English copy, responsive media, highlights, color choices, feature groups, and legal notes.
- Production media was copied into `/content/dam/li-auto/shared/vehicles/li-l9/product-page`; authored blocks do not reference the public Li Auto media domain.

## Scene-to-block mapping

| Production scene | Count | EDS block |
| --- | ---: | --- |
| `product-first` | 1 | `lixiang-product-hero` |
| `SceneTableHorizontal` | 1 | `lixiang-product-intro-slider` |
| `SceneMegaOverview2` / `SceneBeginning` | 7 | `lixiang-product-full-screen-intro` |
| `SceneColorSwitch` | 1 | `lixiang-product-color-full-screen-slider` |
| `SceneMegaContentTableX` | 17 | `lixiang-product-intro-carousel` |
| `SceneMegaContentTableXImage` | 1 | `lixiang-product-feature-picture-group` |
| `SceneMegaContentMultipleImage` | 1 | `lixiang-product-feature-grid` |
| `ScenePictureGroup` | 1 | `lixiang-product-detail-picture-group` |
| `SceneMegaContentNote` | 1 | `lixiang-product-notes` |

The authored page contains 31 parent blocks and 138 ordered child items. Scene order matches production exactly.

## Acceptance criteria

- The L9 hero, highlights, seven chapter panels, nine colors, seventeen detail sections, interior feature cards, home-detail grid, grouped feature gallery, and seven legal notes are visible in production order.
- Desktop, tablet, and mobile fields use the corresponding production media when provided.
- Every authored image, logo, swatch, and video reference resolves under the L9 DAM folder.
- When a production video could not be ingested as a DAM asset, the scene keeps its production poster image and omits the invalid video reference.
- Shared product blocks derive accessible fallbacks from authored vehicle content and contain no L6-specific labels or anchors.
- Universal Editor model metadata remains present on every parent block and child item.
