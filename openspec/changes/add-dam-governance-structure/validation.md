# Validation record

Date: 2026-07-20

Environment: `leadstec-dev` (`author-p80707-e1685574.adobeaemcloud.com`)

## Architecture validation

- `/content/dam/li-auto` was absent before implementation.
- The target structure contains 72 `sling:Folder` descendants.
- Global and Central Asia are parallel roots beneath `/content/dam/li-auto`.
- UAE, SA, NL, KW, KZ, and UZ language leaves match the approved architecture document.
- Dynamic Media configuration and URLs were not introduced.

## Source validation

- The source of truth is `lixiang2/eds-reference/assets/data/site-data.js` `home.blocks`.
- The active Homepage model consumes 41 unique source binaries through 43 component properties.
- All 41 selected source URLs returned HTTP 200 before upload.
- Seven additional mobile-logo/charging sources present in `eds-reference` were intentionally excluded because the current Homepage content model has no consuming property for them.

## DAM validation

- Query below `/content/dam/li-auto` returned exactly 41 `dam:Asset` nodes.
- All 41 assets have `dc:title`, `dc:description`, `dc:language=und`, and `dc:source` metadata.
- All 41 assets have a `jcr:content/renditions/original` node.
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

- Public Preview currently returns HTTP 200 but still contains the previously published `/content/dam/li-demo` video references.
- The new assets and page changes therefore still require Author UI publication.
- The Browser session currently opens the AEM login page. Publication and final 1920px/390px rendering validation remain pending until the user signs in.

## Repository validation

- `openspec validate add-dam-governance-structure --strict`: passed.
- `git diff --check`: passed.
- No production JavaScript, CSS, Universal Editor model, or `lixiang2` source file was modified.
