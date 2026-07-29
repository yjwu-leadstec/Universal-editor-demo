## 1. Analysis and Contract

- [x] 1.1 Verify the latest supplied document and current ontest store response.
- [x] 1.2 Define acceptance criteria, safe activation, content-model boundary,
      request fields, headers, mappings, and external blockers.

## 2. Implementation

- [x] 2.1 Add the pure Test Drive API client, identifiers, mappings, and typed
      result errors.
- [x] 2.2 Integrate explicit `ontest` mode into the existing submit flow while
      preserving custom-event and same-origin behavior.
- [x] 2.3 Add the safe read-first smoke utility and calling-chain documentation.

## 3. Validation and Delivery

- [x] 3.1 Add mock contract coverage for store query, lead add, challenge, and
      captcha retry.
- [x] 3.2 Run `npm run build:json`, lint, and the complete test suite.
- [x] 3.3 Verify the local page at mobile, tablet, and desktop with no write
      request in default mode.
- [x] 3.4 Run the read-only ontest store smoke check.
- [x] 3.5 Rebase onto and push remote `main`, then verify the remote preview.
- [x] 3.6 Record final evidence and remaining external prerequisites.

## Final Evidence

- Remote implementation commit:
  `d7248a0357b65b4690ca660c7f7268edc540f26c`.
- `npm run build:json`, full lint, and all 124 tests passed.
- The real read-only KZ store smoke returned the three documented store codes;
  no real lead POST was performed.
- Local browser QA at 1440, 1024, and 390 px found one block, four model
  options, no horizontal overflow, and zero console errors or warnings.
- Default-mode valid submission produced zero Li Auto API requests and returned
  the existing recoverable error state.
- Browser-mocked `/add` success and `600003` challenge followed by
  `/add-with-captcha` both reached the existing success state.
- Remote Preview loaded the deployed API module and rendered the existing
  desktop/mobile component with blank `apiMode`, no configured submit endpoint,
  no horizontal overflow, and zero console errors or warnings:
  `https://main--universal-editor-demo--yjwu-leadstec.aem.page/language-master/en/test-drive`.
- Activation remains blocked on confirmed English KZ language handling,
  Shymkent store code, agreement version, captcha provider configuration, test
  identity, and CORS allowlisting or an approved proxy.
