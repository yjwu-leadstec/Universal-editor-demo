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
  - Glass state: a vertical black-to-transparent gradient (source stop 60% at 89.4%, 60% fill opacity) with approximately 20 px background blur (`17.5` in `guide.pen`), white logo/text/icons, and no divider or shadow.
  - White state: solid `#fff`, black logo, 90% black primary text, 60% black secondary text/icons, and no divider or shadow.
- The home page starts in the glass state and transitions to the white state after scrolling 10 px. In the glass state the 50 px header is removed from document flow so the first hero begins at `y=0` behind the fixed navigation. Other pages default to white; `header-theme=transparent` and `header-theme=white` remain explicit author overrides.
- Opening a desktop panel or the mobile drawer always switches the bar to the white state so content remains legible.

### Desktop panels

- Vehicles opens a grouped card panel. Battery Electric Vehicle and REEV Vehicle groups are authored independently.
- Cards contain a title, optional background and vehicle images, subtitle, link, and an optional Learn More label.
- Cards use a 4 px radius and 12 px gaps. At 1440 px they are approximately 180 px square and grow on larger canvases.
- Hover/focus adds a border, raises the vehicle/subtitle, and reveals the CTA.
- About Us can use the same authored nested-list pattern for image cards.

### Mobile navigation

- Below 720 px the desktop navigation becomes a full-screen drawer.
- The drawer has a 50 px top bar, 24 px inline spacing, and 48 px navigation rows.
- Menu, close, back, and disclosure indicators use the vectors/dimensions from the guide instead of CSS-drawn approximations. The menu glyph is 24 px with three 18 × 2 px rounded bars; the close control is 24 px.
- Opening a nested item switches the drawer into a detail view with a back control, centered section title, close control, group labels, and two-column title/subtitle rows, as shown by the `M-Guide-Vehicles` artboard.
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

- `/nav` and `/footer` remain independent AEM pages loaded through page metadata, with `/nav` and `/footer` as fallbacks.
- Navigation labels, links, imagery, group names, and footer/legal copy come from those pages. The authored Tools link supplies the current Global English destination; the locale selector currently provides the official market/language catalog as a code fallback because `/nav` has no repeatable locale collection yet.
- The parser accepts EDS-normalized rich text where one authored card becomes several sibling paragraphs and repeated links with the same URL.
- Existing simple nested-list nav content remains supported as a graceful fallback.
- Future localized pages can select localized fragments through `nav` and `footer` metadata without changing code.

## Acceptance Criteria: Global Header/Nav and Footer — Existing Block Enhancement

### Functional Requirements

- [ ] The header renders the authored 48 × 20 px Li Auto logo, five primary links, and globe-only language control.
- [ ] The home page initially renders the Figma glass state and becomes the pure-white state after scrolling; an ordinary page renders pure white from first paint.
- [ ] The glass-state header overlays the first hero without reserving a 50 px gap in document flow.
- [ ] The glass state uses the supplied gradient/blur and white foreground; the white state has no residual blur, divider, or shadow.
- [ ] The desktop globe opens a keyboard-accessible locale dialog with Global, China, Kazakhstan, and Uzbekistan language links; backdrop click, close button, and Escape dismiss it and return focus.
- [ ] Desktop dropdowns open on hover/focus/click, close when leaving or pressing Escape, and expose correct ARIA state.
- [ ] Navigation items without dropdowns remain real links on desktop and mobile.
- [ ] The mobile menu opens/closes, locks scroll, opens nested content in a dedicated detail view, expands the Language locale list, supports Back/Escape, and traps keyboard focus.
- [ ] The footer renders all five authored columns, legal links, copyright, and a working back-to-top control.
- [ ] Header and footer keep Universal Editor instrumentation when authored content is decorated.

### Edge Cases

- [ ] Missing optional card image, subtitle, CTA label, or group label leaves no empty visual gap.
- [ ] Missing nav/footer fragments leave the page usable and do not throw console errors.
- [ ] Long labels wrap or remain readable without horizontal overflow.
- [ ] Legacy simple nav/footer fragment markup still renders.
- [ ] Missing or invalid `header-theme` metadata falls back to glass on `/` and white elsewhere.

### Responsive Behavior

- [ ] Mobile (< 720 px): full-screen navigation drawer and accordion footer, with no horizontal overflow at 375/390 px.
- [ ] Medium (720–1440 px): desktop navigation remains readable; panels and footer columns fit within the viewport.
- [ ] Desktop (> 1440 px): navigation/panel/footer spacing scales toward the 1920 px design without exceeding the content width.

### Author Experience

- [ ] Authors maintain logo, navigation groups/cards, language entry, footer columns, and legal information in `/nav` and `/footer` pages.
- [ ] Required content is the brand link/image and primary navigation labels/links; dropdown images, subtitles, CTA labels, and legal items are optional.
- [ ] Nested list semantics identify dropdown groups and cards even after EDS splits images and text into sibling paragraphs; headings plus following lists identify footer columns.

### Definition of Done

- [ ] Realistic test fragments render in a browser at 390, 1024, 1440, and 1920 px.
- [ ] Interactions and keyboard behavior pass with no console errors.
- [ ] `npm run lint` and `npm run build:json` pass.
- [ ] The `leadstec-dev` `/nav` and `/footer` pages deliver the expected markup.

## Assumptions

- The Global English header follows the authored `/nav` fragment and therefore exposes only the language entry on the right; the Chinese-guide Order Now and Sign In controls are not invented in code.
- The complete mobile footer is used because it preserves all authored global links; the shorter mobile artboard is treated as a crop, not a reduced-content variant.
- `guide.pen` does not define a complete Footer; the Footer baseline comes from the project screenshot manifest and homepage design requirements.
