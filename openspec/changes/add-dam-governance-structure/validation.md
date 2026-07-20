# Validation record

Date: 2026-07-20

Environment: `leadstec-dev` (`author-p80707-e1685574.adobeaemcloud.com`)

## Architecture validation

- `/content/dam/li-auto` was absent before implementation.
- The target structure contains 72 `sling:Folder` descendants.
- Global and Central Asia are parallel roots beneath `/content/dam/li-auto`.
- UAE, SA, NL, KW, KZ, and UZ language leaves match the approved architecture document.
- No Dynamic Media configuration, profile, or authored Dynamic Media URL was introduced. The existing sandbox asset-processing pipeline remains unchanged.

## Source validation

- The source of truth is `lixiang2/eds-reference/assets/data/site-data.js` `home.blocks`.
- The active Homepage model consumes 41 unique source binaries through 43 component properties.
- All 41 selected source URLs returned HTTP 200 before upload.
- Seven additional mobile-logo/charging sources present in `eds-reference` were intentionally excluded because the current Homepage content model has no consuming property for them.

## DAM validation

- Query below `/content/dam/li-auto` returned exactly 41 `dam:Asset` nodes.
- All 41 assets have `dc:title`, `dc:description`, `dc:language=und`, and `dc:source` metadata.
- All 41 assets have a `jcr:content/renditions/original` node.
- A recursive Full Process was run on `/content/dam/li-auto/shared` after upload; all 41 assets reached `dam:assetState=processed` and none remained `processing` or `failed`.
- Representative video original reports `jcr:mimeType=video/mp4` and `:jcr:data=9058723` bytes.

## Homepage reference validation

- Updated 23 AEM component nodes and 43 properties.
- 23/23 `image` properties contain `/content/dam/li-auto/`.
- 7/7 `mobileImage` properties contain `/content/dam/li-auto/`.
- 10/10 `logo` properties contain `/content/dam/li-auto/`.
- 3/3 `video` properties contain `/content/dam/li-auto/`.
- The same four groups all passed explicit `notContains /content/dam/li-demo` verification.
- A stale AEM full-text query continued to return 12 previously indexed nodes; direct property verification is authoritative and contradicts that stale index result.

## Rollback validation

- AEM version creation returned an AEM server error for both the page and `jcr:content` path.
- Package export was refused because the technical account could not commit the filter root.
- `migration-manifest.md` captures all 43 old values and new values and was persisted before the path switch.
- `/content/dam/li-demo` remains unchanged.

## Delivery status

- `paths.json` maps `/content/dam/li-auto/` to `/assets/` and explicitly includes the DAM root for direct EDS asset publication.
- The `home-carousel` video field is an AEM Assets `reference`; all three existing carousel item `modelFields` values were aligned to `video@reference`.
- AEM Assets Quick Publish queued the story media, and AEM Sites Quick Publish confirmed that Homepage and its references were published.
- Preview Homepage HTML returns HTTP 200 and serializes the three videos as `/assets/shared/brand/homepage/stories/*.mp4` links.
- Each human-readable MP4 URL returns HTTP 301 to a same-origin `media_*.mp4`; all three final responses are HTTP 200 with `content-type: video/mp4` and exact source byte lengths (9,058,723; 7,313,485; 26,584,208).
- Public Preview at 1920x1080: Banner visible (`display:block`, 816.95px high), Header/Footer present, no horizontal overflow, no `.block-error`, three videos `readyState=4`, and no console errors.
- Public Preview at 390x844: Banner visible (`display:block`, 585px high), Header/Footer present, no horizontal overflow, no `.block-error`, three videos `readyState=4`, and no console errors.
- AEM Author at 390x844: Banner visible, six sampled Banner images have non-zero natural dimensions, three videos are ready without errors, Header/Footer are present, no horizontal overflow, and no `.block-error`.

## Repository validation

- `openspec validate add-dam-governance-structure --strict`: passed.
- `npm run build:json`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- `lixiang2` source files were not modified.
- Commit `4778f95` was pushed to `origin/main` with the DAM path mapping and aligned video reference model.
