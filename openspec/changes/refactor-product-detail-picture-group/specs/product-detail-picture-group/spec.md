## ADDED Requirements

### Requirement: Canonical product detail picture-group identity

The system SHALL expose Li-L6 section `7 / 多图（产品细节图组）` only as `lixiang-product-detail-picture-group` after migration.

#### Scenario: New authoring

- **WHEN** an author adds the product detail picture group
- **THEN** the definition, model, filter, block directory, section allow-list, and runtime parser use the canonical namespace

#### Scenario: Completed migration

- **WHEN** the content migration is complete
- **THEN** production source, generated JSON, tests, and `/content/demo-site` contain no `picture-group`, `picture-group-item`, or `picture-media-item` identity

### Requirement: Design-aligned dialog

The component SHALL expose only design-backed white/gray themes, responsive outer spacing, header-to-media spacing, optional desktop/tablet copy, responsive image/video media, captions, video controls, and parallax behavior.

#### Scenario: Author selects visual options

- **WHEN** an author selects a theme, spacing, or header-media gap
- **THEN** the selected option maps to a component-scoped rendered class with no unsupported dark or rounded-card variant

#### Scenario: Optional fields are empty

- **WHEN** optional section copy, media copy, mobile media, or video is empty
- **THEN** the component omits the empty output without leaving a structural gap

### Requirement: Approved responsive mosaic

The component SHALL reproduce the selected Pencil mosaic proportions at desktop, tablet, and mobile widths.

#### Scenario: Desktop or tablet layout

- **WHEN** the viewport is at least 720px wide and eight media items are authored
- **THEN** the grid uses the approved proportional 1480×1420 composition and scales to the 768px board without equalizing its unequal rows

#### Scenario: Mobile layout

- **WHEN** the viewport is below 720px wide and eight media items are authored
- **THEN** the grid uses the approved 335×771 two-column staggered composition and omits the section header

### Requirement: Responsive design spacing

The component SHALL apply its approved large, small, and none spacing values independently from generic product blocks.

#### Scenario: Outer spacing

- **WHEN** large or small spacing is selected
- **THEN** the vertical spacing is 160/80px on desktop, 64/32px on tablet, and 80/40px on mobile

#### Scenario: Header-to-media spacing

- **WHEN** large or small header-media spacing is selected
- **THEN** desktop and tablet use the corresponding design-backed gap without altering outer section spacing

### Requirement: Safe parallax media

The component SHALL center authored images on a 1.4× canvas and apply bounded scroll-linked vertical movement.

#### Scenario: Motion is allowed

- **WHEN** parallax is enabled and the user has not requested reduced motion
- **THEN** visible images move within their clipped square-corner media frames without exposing empty edges

#### Scenario: Reduced motion

- **WHEN** the user requests reduced motion
- **THEN** scroll-linked movement is not registered and the centered media remains stable

### Requirement: Authoring and accessibility preservation

The component SHALL preserve Universal Editor instrumentation and accessible relationships while rendering responsive images, videos, captions, and optional multiple picture sets.

#### Scenario: AEM content is decorated

- **WHEN** the block restructures container, set, and media item markup
- **THEN** the corresponding `data-aue-*` instrumentation remains attached to the rendered editable elements

#### Scenario: Multiple sets are authored

- **WHEN** more than one picture set exists
- **THEN** keyboard-accessible tabs identify and control their corresponding panels
