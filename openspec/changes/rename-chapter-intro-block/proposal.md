# Change: Rename Chapter Intro Block

## Why

The Li L6 full-screen chapter opener is currently exposed as the generic
`chapter-intro` block even though it is a Li Auto product-page component.
The generic name also made it easier to select the wrong carousel component
while authoring.

## What Changes

- **BREAKING:** rename the canonical block identifier from `chapter-intro` to
  `lixiang-product-full-screen-intro`.
- Rename the block directory, JavaScript, CSS, Universal Editor model,
  block-specific DOM classes, tests, and documentation references.
- Remove the old block name completely; no alias, redirect, fallback loader, or
  legacy CSS selector will remain.
- Replace the six Li L6 chapter opener instances with clean
  `lixiang-product-full-screen-intro` content nodes while preserving their
  authored copy and DAM media.
- Remove obsolete carousel-only properties and nested slide items from those
  six instances.

## Impact

- Affected specs: `full-screen-intro`
- Affected code: `blocks/chapter-intro/`, component model aggregation,
  `models/_section.json`, product block field metadata, tests, and Li L6
  component content.
- Affected page:
  `/content/demo-site/language-master/en/li-l6`
