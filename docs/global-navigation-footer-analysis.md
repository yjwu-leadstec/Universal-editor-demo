# Global Navigation and Footer Analysis

## Overview

- Type: global header/navigation and footer fragments
- Purpose: replace the legacy Leadstec navigation and empty footer in `leadstec-dev` with the Li Auto Global English design
- Design references: Figma `2026 Global Website` node `9:974`, `lixiang2/docs/pencil/guide.pen` (read through Pencil MCP), `lixiang2/docs/screenshots/components/**/global-{header,footer}.png`, and the `vehicles-open`/`scrolled` header states
- Viewports: 390 px mobile, 1024 px medium, 1440/1920 px desktop

## Visual Requirements

### Header and primary navigation

- Fixed 50 px navigation bar with the official 48 × 20 px Li Auto mark at the left (40 px desktop inset).
- Desktop primary links: Vehicles, Official Center, Service, Media Center, and About Us.
- Primary navigation uses `licium-regular`, 14 px text, and an underline for hover, focus, current, and expanded states.
- The desktop language entry is a globe-only control. It opens the Global English locale dialog with the title `Select a region and language`, a dimmed backdrop, and the supported region/language links.
- The Figma guide defines two explicit base states:
  - Desktop glass state (`>= 1000 px`): a vertical black-to-transparent gradient (source stop 60% at 89.4%, 60% fill opacity) with 20 px background blur (`17.5` in `guide.pen`), white logo/text/icons, and no divider or shadow.
  - Compact transparent state (`< 1000 px`): a fully transparent bar with no gradient or background blur, white logo/icons, and the hamburger navigation.
  - White state: solid `#fff`, black logo, 90% black primary text, 60% black secondary text/icons, and no divider or shadow.
- The home page starts in the desktop glass or compact transparent state and transitions to the white state after scrolling 10 px. In either transparent state the 50 px header is removed from document flow so the first hero begins at `y=0` behind the fixed navigation. Other pages default to white; `header-theme=transparent` and `header-theme=white` remain explicit author overrides.
- Opening a desktop panel or the mobile drawer always switches the bar to the white state so content remains legible.
- The project keeps its global Large / Medium / Small layout tiers (`1441+`, `720-1440`, `<=719`). The Header additionally owns a component-specific `1000 px` behavior breakpoint; this is not a fourth global layout tier.

### Desktop panels

- Vehicles opens a grouped card panel. Battery Electric Vehicle and REEV Vehicle groups are authored independently.
- Cards contain a title, optional background and vehicle images, subtitle, link, and an optional Learn More label.
- Cards use a 4 px radius and 12 px gaps. At 1440 px they are approximately 180 px square and grow on larger canvases.
- Hover/focus adds a border, raises the vehicle/subtitle, and reveals the CTA.
- About Us can use the same authored nested-list pattern for image cards.

### Compact navigation

- Below 1000 px the desktop navigation becomes a full-screen drawer. This includes the compact portion of the global Medium tier (`720-999 px`) and the whole Small tier.
- The drawer has a 50 px top bar, 24 px inline spacing, and 48 px navigation rows.
- Menu, close, and disclosure indicators use the supplied vector assets instead of CSS-drawn approximations. The menu/close chrome occupies a 20 px control width, matching the verified production site at compact breakpoints.
- Opening a nested item expands an inline accordion below its root row. The Li Auto logo and close control remain visible; no back button or centered duplicate section title is introduced. Group labels and linked rows remain inside the expanded panel.
- Opening the drawer locks page scrolling. Escape, the close control, and navigation links close it.
- Focus remains within the drawer while it is open and returns to the menu button on close.
- The Language row expands an inline locale list on the light-gray panel defined by the guide.

### Footer

- Dark background (`#141414` on the home page design) with five desktop columns.
- Desktop column headings are 14 px; links and legal copy are 12 px.
- Mobile columns become accessible accordions and the footer uses natural height so all authored content remains available.
- Cookie Policy, Privacy Policy, and copyright are authored content.
- The back-to-top control appears after scrolling and uses smooth scrolling unless reduced motion is requested.

## Content and Authoring Impact

- `/nav` and `/footer` are independent AEM pages under every language root. The resolver supports Global English `/en`, market roots `/<market>/<language>`, and `/language-master/<language>`; root `/nav` and `/footer` remain migration fallbacks only.
- Navigation labels, links, imagery, group names, and footer/legal copy come from those pages. The locale selector reads repeatable `locale-option` items from the authored `/en/locale-directory`; there is no market catalog fallback hardcoded in `header.js`.
- The parser accepts EDS-normalized rich text where one authored card becomes several sibling paragraphs and repeated links with the same URL.
- Existing simple nested-list nav content remains supported as a graceful fallback.
- Current nested market routes automatically select the `nav` and `footer` under their own language root; page metadata remains available for deliberate fragment overrides.

## Acceptance Criteria: Global Header/Nav and Footer — Existing Block Enhancement

### Functional Requirements

- [ ] The header renders the authored 48 × 20 px Li Auto logo, five primary links, and globe-only language control.
- [ ] The home page initially renders the Figma glass state and becomes the pure-white state after scrolling; an ordinary page renders pure white from first paint.
- [ ] The glass-state header overlays the first hero without reserving a 50 px gap in document flow.
- [ ] The glass state uses the supplied gradient/blur and white foreground; the white state has no residual blur, divider, or shadow.
- [ ] The desktop globe opens a keyboard-accessible locale dialog with the approved Global, UAE, Saudi Arabia, Netherlands, Kuwait, Kazakhstan, and Uzbekistan destinations; backdrop click, close button, and Escape dismiss it and return focus.
- [ ] Desktop dropdowns open on hover/focus/click, close when leaving or pressing Escape, and expose correct ARIA state.
- [ ] Navigation items without dropdowns remain real links on desktop and mobile.
- [ ] The compact menu opens/closes, locks both the document and body scrollports, expands nested content inline, keeps the logo visible, and expands the Language locale list. Escape first collapses an open accordion and then closes the drawer.
- [ ] The footer renders all five authored columns, legal links, copyright, and a working back-to-top control.
- [ ] Header and footer keep Universal Editor instrumentation when authored content is decorated.

### Edge Cases

- [ ] Missing optional card image, subtitle, CTA label, or group label leaves no empty visual gap.
- [ ] Missing nav/footer fragments leave the page usable and do not throw console errors.
- [ ] Long labels wrap or remain readable without horizontal overflow.
- [ ] Legacy simple nav/footer fragment markup still renders.
- [ ] Missing or invalid `header-theme` metadata falls back to glass on `/` and white elsewhere.

### Responsive Behavior

- [ ] Small (< 720 px): fully transparent home-page bar at the top, full-screen navigation drawer, and accordion footer, with no horizontal overflow at 375/390 px.
- [ ] Medium (720–1440 px): Header uses the compact transparent/drawer behavior from 720–999 px and desktop glass/panel behavior from 1000–1440 px; other blocks remain in the global Medium tier.
- [ ] Desktop (> 1440 px): navigation/panel/footer spacing scales toward the 1920 px design without exceeding the content width.

### Author Experience

- [ ] Authors maintain logo, navigation groups/cards, footer columns, and legal information in each language root's `/nav` and `/footer`; locale destinations are maintained in `/en/locale-directory`.
- [ ] Required content is the brand link/image and primary navigation labels/links; dropdown images, subtitles, CTA labels, and legal items are optional.
- [ ] Nested list semantics identify dropdown groups and cards even after EDS splits images and text into sibling paragraphs; headings plus following lists identify footer columns.

### Definition of Done

- [ ] Realistic test fragments render in a browser at 390, 768, 999, 1000, 1024, 1440, and 1920 px.
- [ ] Interactions and keyboard behavior pass with no console errors.
- [ ] `npm run lint` and `npm run build:json` pass.
- [ ] The `leadstec-dev` language-root `nav`, `footer`, and shared `locale-directory` pages deliver the expected markup.

## Assumptions

- The Global English header follows the authored `/nav` fragment and therefore exposes only the language entry on the right; the Chinese-guide Order Now and Sign In controls are not invented in code.
- The complete mobile footer is used because it preserves all authored global links; the shorter mobile artboard is treated as a crop, not a reduced-content variant.
- `guide.pen` does not define a complete Footer; the Footer baseline comes from the project screenshot manifest and homepage design requirements.
