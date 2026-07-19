# Validation Report: Refactor Localized Site Shell

## Scope

本报告记录提案编写期间已经执行的三轮设计校验。它验证的是方案完整性和事实依据，不等同于实施后的代码、Author、Preview 或 Live 验收。

## Round 1 — Repository and Author Facts

### Checks performed

- 读取当前 `header.js`、`footer.js`、`fragment.js`、`scripts.js`、page model 和现有作者手册。
- 通过 `aem-content-mcp` 只读连接 `leadstec-dev`，检查 language-master/en、nav、footer 与 global 分支。
- 请求当前 Preview 页面、fragment paths 和 `/metadata.json`。

### Findings and optimizations

| Finding | Risk | Design optimization | Status |
| --- | --- | --- | --- |
| code defaults to `/nav` and `/footer` | language-root content never selected automatically | shared localized sibling resolver | resolved in spec |
| hardcoded locale catalog and English UI strings | code release required for every market/language | authored header-settings + locale-directory | resolved in spec |
| `html.lang` fixed to `en` | incorrect accessibility/SEO for new languages | dynamic language/direction contract | resolved in spec |
| language-master nav/footer exist but `cq:isDelivered=false` and Preview fragment 404 | pages cannot consume them yet | explicit independent publish gate and order | resolved in migration plan |
| `/content/demo-site/global` does not exist | proposed public path cannot be tested today | blueprint-first `/global/en` Live Copy phase | explicitly gated |
| source links are root-relative | cross-locale navigation after rollout | AEM content reference migration + link rewrite audit | release blocker defined |
| `/metadata.json` is 404 and page model lacks shell fields | metadata rollback assumption is false | default path resolver independent of metadata; add optional page fields | corrected after review |

## Round 2 — Adobe Architecture and Content Modeling

### Checks performed

- Compared the target with Adobe's EDS Header/Footer tutorial.
- Compared content flow with Adobe AEM Cloud Service MSM overview and best practices.
- Checked EDS semantic modeling/single-level nesting and Universal Editor field/container limits.
- Compared proposed models with this repository's existing container + item definitions.

### Findings and optimizations

| Finding | Initial design concern | Optimization | Status |
| --- | --- | --- | --- |
| EDS officially uses dedicated nav/footer pages | avoid turning shell into per-page components | retain independent fragment pages under every locale root | aligned |
| MSM officially separates language master and country/language Live Copies | `/global/en` must not be a manual clone | blueprint + governed rollout | aligned |
| UE nested multifield/container nesting is constrained | market → language nested author model is fragile | flat locale-option items grouped by marketCode | aligned |
| extra selector request must not block LCP | putting all labels in locale-directory delayed core nav | split labels/reference into nav-local header-settings | optimized in revision |
| content-modeling guidance favors semantics | DOM reconstruction can damage fallback | parse/validate before enhancement; preserve real anchors and source DOM | contract added |
| MSM onModify/custom rollout adds operational risk | automatic propagation can overwrite local changes | standard config + manual reviewed rollout | governance added |

## Round 3 — Adversarial and Operational Review

### Checks performed

- Walked path matrix for language-master, global/en, bilingual markets, legacy paths and metadata override.
- Injected design-level failures: 404 fragment/directory, malformed DOM, duplicate/disabled locale options, missing link, stale cache and unavailable destination.
- Reviewed keyboard/focus/ARIA, RTL, long labels and four responsive breakpoints.
- Reviewed publish dependency order, canary, fallback retirement and Live Copy rollback hazards.

### Findings and optimizations

| Attack | Required behavior | Optimization | Status |
| --- | --- | --- | --- |
| unsafe/cross-origin fragment metadata | no data exfiltration or unexpected fetch | same-origin/scheme validation | specified |
| localized fragment 404 | no page-wide failure | candidate fallback during migration; non-blocking after retirement | specified |
| locale-directory 404 | no empty modal | retain authored tools anchor | specified |
| missing href | no fake navigation | never synthesize `#`; use button/text/skip | specified |
| duplicate option/link | deterministic output | first-valid + warning and author gate | specified |
| destination not published | users must not reach 404 | enabled=false until destination + shell Preview 200 | specified |
| RTL first render | avoid late layout direction flip | eager BCP 47 technical direction + authored consistency check | optimized in revision |
| rollout overwrites local legal content | market compliance risk | recorded inheritance cancellation and owner model | specified |
| detach used as rollback | irreversible relationship loss | explicitly prohibited as routine rollback | specified |
| old fallback never removed | permanent architecture debt | owner/date/exit criteria + separate retirement phase | specified |

## Automated Specification Checks

- `openspec validate refactor-localized-site-shell --strict`: pass.
- `openspec show refactor-localized-site-shell --json --deltas-only`: all four capability deltas parse successfully.
- `git diff --check -- openspec/changes/refactor-localized-site-shell`: pass.

These commands must be rerun after every proposal revision and once more during the completion audit.

## Remaining Approval Inputs

The architecture is internally consistent without these answers, but implementation data and acceptance scope depend on:

1. final public locale slugs;
2. first-wave enabled destinations;
3. whether Arabic/RTL is first-wave;
4. rollout/legal ownership.

The user approved implementation and deployment. The remaining inputs only gate additional locales,
MSM rollout, locale-directory population, and legacy retirement.

## Implementation and Deployment Evidence — 2026-07-20

### Code delivery

- Header/footer localized shell implementation committed as `f6f05d2`.
- Locale-directory probing for legacy nav content corrected in `d4de7b0`.
- Implementation commits and deployment evidence commit `7423ea3` were pushed to
  `align-nav-homepage` and fast-forwarded to `main`.
- Main verification URL: `/language-master/en/homepage`.

### Author content

- Connected read/write to the `leadstec-dev` profile through AEM Content MCP.
- Updated only `/content/demo-site/language-master/en/nav` and `footer`; `/site/nav` was not read as a source or modified.
- Rebased 15 nav and 15 footer internal anchors from root-relative paths to `/language-master/en/*`.
- MCP post-write verification passed for both text nodes.
- Published exactly the localized nav/footer pages through AEM Manage Publication,
  first to Preview and then to Publish/Live.
- AEM Preview returned the explicit success state `Your previews have been created`
  with links for both pages; Live returned the scheduled-publication success toast.
- EDS localized nav/footer endpoints return HTTP 200 on both `aem.page` and `aem.live`.

### Automated and browser verification

- `npm run test:shell`: 9/9 pass.
- `npm run lint`: pass.
- `npm run build:json`: pass.
- `openspec validate refactor-localized-site-shell --strict`: pass.
- Local, branch Preview, and main were tested at `/language-master/en/homepage`.
- 390, 1024, 1440, and 1920 px: no horizontal overflow; `html[lang=en][dir=ltr]`; header and footer render.
- Desktop mega panel open/Escape close and mobile drawer/detail/back/Escape focus restoration pass.
- Mobile footer accordion state/ARIA pass.
- With no authored header-settings/locale-directory, the language control remains a real `/global/en` anchor and no empty dialog is rendered.
- Post-publication Preview network checks load only
  `/language-master/en/nav.plain.html` and `footer.plain.html` with HTTP 200; the
  root `/nav` and `/footer` migration fallback is not requested.
- Post-publication Live smoke tests pass at 390 and 1440 px with the same localized
  links, five footer columns, `lang=en`, `dir=ltr`, and no horizontal overflow.

### Released scope and deferred work

The requested first-wave shell scope is released and verified on
`/language-master/en/homepage`. Locale-directory population, additional countries,
MSM rollout, and migration-fallback retirement remain intentionally deferred.

The homepage still reports three pre-existing missing DAM video requests
(`video-01-home.mp4`, `video-02-face.mp4`, and `video-03-growth.mp4`) outside this
header/footer change. No header/footer fragment 404 or shell JavaScript error remains.
