# Live Media Center content migration

Snapshot source: `https://www.liauto.com/news.html`, `picture.html`, and `video.html`, captured on 2026-07-25. This document is an editorial migration manifest, not a runtime content source. The deployed page must use Author-managed values and DAM assets.

## Routes

| Live route | Proposed EDS page | Active tab |
| --- | --- | --- |
| `/news.html` | `/language-master/en/media-center` | `newsroom` |
| `/picture.html` | `/language-master/en/media-center/photos` | `photos` |
| `/video.html` | `/language-master/en/media-center/videos` | `videos` |

Every target page uses one `live-media-header` with these route references, followed by one `live-media-grid` whose type is the active tab. Preserve the exact title string when creating matching `live-media-card-meta` rows.

## Newsroom (`live-media-grid.type = newsroom`)

| Title | Date | Live cover | Destination |
| --- | --- | --- | --- |
| Li Auto Accelerates Global Expansion: All-New Li L9 Launched in Kazakhstan, President Tokayev Witnesses Signing of Strategic MOU with Allur Group | July 21, 2026 | `https://mall-public.liauto.com/mall/20260721/cms/news/2f14b175-5140-48c2-bbe4-94bf1e9dedca.JPEG` | `/news/13.html` |
| Li Auto Officially Enters Macao Market, Further Expanding Its Global Footprint | June 29, 2026 | `https://mall-public.liauto.com/mall/20260629/cms/news/775abfdb-4a43-4d29-b276-27bb210a2da5.JPEG` | `/news/12.html` |
| Li Auto Officially Signs the Partnership Agreement with UAE's AI Fahim Motors and Saudi Arabia's Mohamed Yousuf Naghi Motors, Expands in Asia‑Pacific, Accelerating Global Growth | May 19, 2026 | `https://mall-public.liauto.com/mall/20260519/cms/news/666ba29b-4457-4120-a824-7995d18a4498.jpg` | `/news/11.html` |
| All-New Li L9 Officially Launched in China, International Exclusive Version to Debut in Q3 | May 15, 2026 | `https://mall-public.liauto.com/mall/20260514/cms/news/deca0fdc-24ce-4d3d-9d76-d3a8d0d6ce90.png` | `/news/10.html` |
| Li Auto Accelerates Global Expansion with Launches in Egypt, Kazakhstan, and Azerbaijan | January 6, 2026 | `https://mall-public.liauto.com/mall/20260106/cms/news/d9177715-59e5-485b-83ca-f58b201ebd61.JPEG` | `/news/9.html` |
| Li Auto Obtains First Overseas Whole-Vehicle Certification | January 6, 2026 | `https://mall-public.liauto.com/mall/20260106/cms/news/8d6970f5-4324-4c83-82c6-d1e38faca8cf.jpg` | `/news/8.html` |
| Li Auto Officially Enters Kazakhstan and Uzbekistan with Certified Dealership Partners | December 31, 2025 | `https://mall-public.liauto.com/mall/20251231/cms/news/4285325a-f474-4805-8446-03f58b01d930.JPEG` | `/news/7.html` |

## Photos (`live-media-grid.type = photos`)

| Title | Count | Date | Live cover | Destination |
| --- | ---: | --- | --- | --- |
| Li L6 | 5 | January 7, 2026 | `https://mall-public.liauto.com/mall/20260107/cms/media/9855cef2-663b-4dbc-8e8f-b9ded8a19e04.jpg?x-oss-process=image/resize,w_800/format,jpg/auto-orient,1` | `/picture/album/13.html` |
| Li L7 | 5 | January 6, 2026 | `https://mall-public.liauto.com/mall/20251231/cms/media/9a9cfd88-1a09-4210-bc5f-26903ee6247d.jpg?x-oss-process=image/resize,w_800/format,jpg/auto-orient,1` | `/picture/album/8.html` |
| Li L9 | 5 | January 6, 2026 | `https://mall-public.liauto.com/mall/20251231/cms/media/53e2ece1-4f39-42c7-aad3-95444118d786.jpg?x-oss-process=image/resize,w_800/format,jpg/auto-orient,1` | `/picture/album/9.html` |
| Li i8 | 7 | January 6, 2026 | `https://mall-public.liauto.com/mall/20251231/cms/media/a631ad98-2fb0-426e-947d-8b49a02949e5.jpg?x-oss-process=image/resize,w_800/format,jpg/auto-orient,1` | `/picture/album/10.html` |
| Li i6 | 17 | January 6, 2026 | `https://mall-public.liauto.com/mall/20251231/cms/media/5a696988-f92c-4c60-887e-b3fe265fc964.jpg?x-oss-process=image/resize,w_800/format,jpg/auto-orient,1` | `/picture/album/11.html` |
| Li MEGA | 9 | January 6, 2026 | `https://mall-public.liauto.com/mall/20251231/cms/media/a8de3f7f-7c84-4bea-ae4d-33ca5669bf3a.jpg?x-oss-process=image/resize,w_800/format,jpg/auto-orient,1` | `/picture/album/12.html` |

For each Photos row, add a `live-media-card-meta` item with the same `title`, its `quantity`, and descriptive `imageAlt`.

## Videos (`live-media-grid.type = videos`)

| Title | Duration | Date | Live cover | Destination |
| --- | --- | --- | --- | --- |
| L9 Central Asia Launch Video | 01:52 | January 7, 2026 | `https://mall-public.liauto.com/mall/754223118173429/c5a8a032-d906-43b9-a730-ff3cdb85f2b2.jpg` | `/video/68.html` |

For the Videos row, add a `live-media-card-meta` item with the same `title`, its `duration`, and descriptive `imageAlt`.

## Required execution sequence

1. Upload or approve DAM equivalents for the listed covers; do not hotlink production images in the published EDS content.
2. Deploy the new block files and merged component model JSON together.
3. Create the two child pages, replace the old single-route content with the new blocks, and author the above collection values.
4. Map destinations to rebuilt detail pages when those pages exist; until then, retain the listed live destination links.
5. Validate each author page and the delivered EDS routes against its matching live list page at desktop and mobile breakpoints before publishing.
