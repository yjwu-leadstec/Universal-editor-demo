# Lixiang Test Drive Booking alignment

## Sources

- Live page: `https://www.liauto.com/kk_kz/drive/reserve.html?sourceTag=nav`
- Live content model: `drive-shop-config`
- Figma node: `69:9228`

The live content model exposes separate `bgPc` and `bgPad` values for every
vehicle. As of 2026-07-28, both values point to the same Test Drive artwork for
each vehicle, but they remain independent authoring fields.

| Model | PC / Pad source | Original size |
| --- | --- | --- |
| All-New Li L9 | `20260511/f76dceb0-6f90-435b-ace7-50e4e10e34bd.png` | 1503×1029 |
| All-New Li L8 | `20260616/b088ba30-9670-4864-b73b-fbcab70d42b0.png` | 1503×1029 |
| Li L6 | `20260409/6856bf02-968d-48fa-9cf6-03886b5a4241.jpg` | 1503×1029 |
| Li L7 | `20260409/8913d8a0-b871-4873-b9c5-3a1325a6baad.jpg` | 3006×2058 |

## Acceptance criteria

- The block, model, filter, folder, and entry-point name is
  `lixiang-test-drive-booking`.
- Every model item exposes `pcImage`, `pcImageAlt`, `padImage`, and
  `padImageAlt`.
- PC is selected above 1440px; Pad is selected at and below 1440px and falls
  back to PC when empty.
- The runtime preserves the largest AEM picture source instead of copying a
  750px `currentSrc`.
- At 1920px, 1024px, and 390px the selected image has enough intrinsic
  resolution for its rendered box, the page has no horizontal overflow, and
  model/store selection plus form validation remain functional.
- Universal Editor retains selectable instrumentation for all four model items
  and four store items.

Authoring, publication, and troubleshooting procedures are documented in
[`component-manual/试驾页-使用配置手册.md`](./component-manual/试驾页-使用配置手册.md).
