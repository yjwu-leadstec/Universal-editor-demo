# Test Drive API Integration

## Current Safety State

`lixiang-test-drive-booking` contains the ontest contract adapter, but the
deployed component does not enable it by default. Without
`data-api-mode="ontest"`, the block sends no request to the Li Auto lead API.

This is intentional because:

- `*.aem.page` is not currently allowed by the ontest API CORS response;
- the current AE and KW store queries return no store codes;
- the final agreement version for this page is not confirmed;
- captcha token acquisition still needs an authorized provider.

Write smoke requests must use an explicit test identity and the `--allow-write`
gate described below.

## Implemented Call Chain

1. The component validates name, model, store, email, optional phone, and
   consent locally.
2. It emits the cancelable `testdrive:submit` event. An integrator may call
   `preventDefault()` and own submission exactly as before.
3. Only explicit runtime mode `ontest` selects the Li Auto adapter.
4. The adapter resolves:
   - an allowlisted `leadSource`, either configured or from
     `chjchannelcode`;
   - an ISO 639 two-letter `leadsLanguage` for the current page language;
   - `vehicleSeries` from the selected model key;
   - `storeCode` from the selected store key;
   - a fresh device GUID and 32-character trace ID;
   - the documented source, metadata, and trace headers.
5. It posts to:
   `POST /saos-global-leads-api/leads/add`.
6. API `code: 0` opens the existing success screen.
7. API `code: 600003` raises `TestDriveChallengeRequiredError`, emits
   `testdrive:challenge-required`, and keeps the form recoverable.
8. If an authorized runtime integration supplies
   `block.testDriveChallengeProvider`, the returned token is retried through:
   `POST /saos-global-leads-api/leads/add-with-captcha`, with
   `Challenge-Authorization: Bearer <token>`.

The ontest base is restricted in code to:
`https://bcs-api-web-ontest-b.liauto.com`.

## Documented Mappings

### Models

| Authored key | API `vehicleSeries` |
| --- | --- |
| `l9` | `L9` |
| `l8` | `X02` |
| `l7` | `X03` |
| `l6` | `X04` |

### Stores

The read-only endpoint was called successfully on 2026-07-30:

`GET /saos-global-leads-api/leads/query-store-list?countryCode=KZ`

| Authored key | API `storeCode` | Current API result |
| --- | --- | --- |
| `allur-almaty` | `KZ_VLPYHG` | Allur, Almaty |
| `allur-astana` | `KZ_XKJQZM` | Allur, Astana |
| `doscar-almaty` | `KZ_RBNTFD` | Doscar, Almaty |
| `doscar-shymkent` | none | Rejected before write |

The same endpoint returned `code: 0` with an empty `storeCodes` array for
both `countryCode=AE` and `countryCode=KW` on 2026-07-30. The API is reachable,
but those markets cannot obtain a valid store code from the test environment
yet.

### Languages

`leadsLanguage` is the current page language expressed as an ISO 639
two-letter code. For the approved site roots this means:

| Site root | `countryCode` | `leadsLanguage` |
| --- | --- | --- |
| `/ae/en` | `AE` | `en` |
| `/ae/ar` | `AE` | `ar` |
| `/kw/en` | `KW` | `en` |
| `/kz/kk` | `KZ` | `kk` |
| `/kz/ru` | `KZ` | `ru` |
| `/uz/uz` | `UZ` | `uz` |
| `/uz/ru` | `UZ` | `ru` |

### 2026-07-30 Write Probe

With explicit test-only identities, `/leads/add` was called for `AE/en`,
`AE/ar`, and `KW/en`:

- an empty `storeCode` returned `code: 1004` (`Store code cannot be empty`)
  for all three combinations;
- temporarily supplying the documented KZ test store code advanced `AE/ar`
  and `KW/en` to `code: 600003` (verification required);
- the same cross-market probe for `AE/en` returned `code: 100000` because
  protocol data could not be saved.

These results show that the documented language codes reach the write API.
They do not replace market-specific AE/KW store codes, agreement configuration,
or an authorized challenge token.

## Runtime Settings

These values are integration settings, not Universal Editor fields:

| DOM/runtime value | Required for ontest write | Notes |
| --- | --- | --- |
| `data-api-mode="ontest"` | yes | Exact value; absent means disabled |
| `data-api-base-url` | no | May only resolve to the approved ontest origin |
| `data-lead-source` | conditionally | May come from allowlisted `chjchannelcode` |
| `data-leads-language` | yes | Current page language as an ISO 639 two-letter code |
| `data-country-code` | yes | Current market as an uppercase two-letter country code |
| `data-phone-country-code` | no | Falls back to the form value (`+7`) |
| `data-agreement-id` | yes | Supplied sample uses `privacy` |
| `data-agreement-version` | yes | Must match the approved page agreement |
| `block.testDriveChallengeProvider` | for captcha retry | Async function returning a challenge token |

Do not put challenge tokens or customer data in attributes.

## Safe Smoke Commands

The default smoke is read-only:

```bash
node scripts/smoke-test-drive-api.mjs
```

It calls the KZ store endpoint and prints only public store codes and names.

The write path has two gates:

1. pass `--allow-write`;
2. provide complete test-only environment values.

Required values:

```text
TEST_DRIVE_SOURCE_URL
TEST_DRIVE_LEAD_SOURCE
TEST_DRIVE_LANGUAGE
TEST_DRIVE_COUNTRY_CODE
TEST_DRIVE_MODEL_KEY
TEST_DRIVE_STORE_KEY
TEST_DRIVE_CUSTOMER_NAME
TEST_DRIVE_EMAIL
TEST_DRIVE_PHONE_COUNTRY_CODE
TEST_DRIVE_AGREEMENT_ID
TEST_DRIVE_AGREEMENT_VERSION
```

Optional values:

```text
TEST_DRIVE_PHONE
TEST_DRIVE_CHALLENGE_TOKEN
```

Then run:

```bash
node scripts/smoke-test-drive-api.mjs --allow-write
```

The script never prints the lead payload. If `/leads/add` returns `600003`
without `TEST_DRIVE_CHALLENGE_TOKEN`, it stops with exit code `2`. Supplying an
authorized token exercises `/leads/add-with-captcha`.

## Remaining Activation Checklist

- Li Auto confirms the lead source for direct `sourceTag=nav` traffic.
- Li Auto configures AE and KW stores in `query-store-list`.
- Li Auto supplies the current Doscar Shymkent code or the page removes that
  selectable store.
- The page privacy agreement ID/version is confirmed.
- The captcha SDK/client configuration and token-provider contract are
  approved.
- Li Auto allowlists the deployed EDS origins for credentialed CORS, or the
  project supplies an approved same-origin server-side proxy.
- A designated non-production test identity is supplied before the first POST
  smoke.
