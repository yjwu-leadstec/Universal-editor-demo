## 1. Validation and manifest

- [x] 1.1 Audit `eds-reference` Homepage asset fields and current AEM Homepage consumers.
- [x] 1.2 Confirm all selected source URLs return HTTP 200 with expected MIME types.
- [x] 1.3 Freeze target folders, filenames, and old-to-new component property mapping.

## 2. DAM structure

- [x] 2.1 Create `/content/dam/li-auto` and shared asset folders.
- [x] 2.2 Create Global and Central Asia market/language boundaries.
- [x] 2.3 Create intake and archive boundaries.
- [x] 2.4 Verify all required folders exist before upload.

## 3. Asset migration

- [x] 3.1 Upload 25 vehicle/hero/logo assets.
- [x] 3.2 Upload 8 brand story/lifestyle assets.
- [x] 3.3 Upload 8 technology assets.
- [x] 3.4 Verify 41 unique target assets and basic metadata.

## 4. Homepage references

- [x] 4.1 Capture a page version and old property map. (Version API unavailable; authoritative rollback map captured in `migration-manifest.md`.)
- [x] 4.2 Update 43 Homepage asset-valued properties.
- [x] 4.3 Verify no Homepage asset property references `/content/dam/li-demo`.

## 5. Delivery validation

- [ ] 5.1 Verify AEM Author and `.plain.html` asset/page delivery.
- [ ] 5.2 Verify Homepage at 1920px and 390px with Banner visible and no `.block-error`.
- [ ] 5.3 Record final asset counts, property verification, rollback evidence, and remaining risks.
