# Product intro carousel migration validation

## Scope

- Environment: `leadstec-dev`
- Content root: `/content/demo-site`
- Affected pages:
  - `/content/demo-site/language-master/en/li-l6`
  - `/content/demo-site/language-master/en/li-l6-aligned`
  - `/content/demo-site/language-master/en/li-l6-backup-20260721`
- Migration safety deployment: `cae06dc`
- Pre-change Git tag: `milestone/pi-20260724`

## Inventory and migration

| Node type | Legacy query count | Canonical query count after migration |
| --- | ---: | ---: |
| Container | 21 `feature-media-section` | 21 `lixiang-product-intro-carousel` |
| Slide | 25 `feature-media-item` | 25 `lixiang-product-intro-slide` |

The migration updated container and slide `name`, `model`, `filter`, `modelFields`,
default behavior fields, and `nodename` metadata. Every JCR node was also moved to
the canonical numbered node name while preserving its authored content and sibling
order.

Post-migration AEM checks:

- Legacy container query: `0`
- Legacy slide query: `0`
- Legacy `nodename` property query: `0`
- Canonical container metadata verification: `21/21`
- Canonical slide metadata verification: `25/25`
- Canonical delivery-name verification: `21/21` use `Lixiang Product Intro Carousel`,
  which serializes to the runtime block name `lixiang-product-intro-carousel`
- Unsupported `overlay-tabs` variant query: `0`
- Active and aligned page order: `block-00` through `block-33`, verified strictly increasing
- Backup page order: `block-00` through `block-10`, verified strictly increasing
- Temporary ordering buffers remaining: `0`
- Two-slide Sky Blue order: `item-00`, `item-01`

## Repository verification

- The temporary `blocks/feature-media-section/` runtime entry is removed.
- Legacy fallback field and collection mappings are removed.
- Canonical production JavaScript and CSS use no legacy container or item identity.
- Generated component definitions, models, and filters expose only the canonical
  authoring models.

## Delivery verification

Complete this section after the migrated pages are published:

- [ ] Preview HTML contains only `lixiang-product-intro-carousel`.
- [ ] Active Li L6 page renders 10 canonical instances without `.block-error`.
- [ ] Desktop and mobile layouts have no horizontal overflow.
- [ ] Browser console contains no component errors.
- [ ] The temporary compatibility entry returns `404` after final code deployment.
