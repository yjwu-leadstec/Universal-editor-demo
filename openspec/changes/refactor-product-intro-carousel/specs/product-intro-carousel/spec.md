## ADDED Requirements

### Requirement: Canonical component identity

The system SHALL expose the product content-display block only as `lixiang-product-intro-carousel` after the staged migration is complete.

#### Scenario: New authoring

- **WHEN** an author adds the product intro carousel
- **THEN** the definition, model, filter, block directory, and section allow-list use `lixiang-product-intro-carousel`

#### Scenario: Completed content migration

- **WHEN** the migration is complete
- **THEN** `/content/demo-site`, generated component JSON, production block source, runtime parser mappings, and tests contain no `feature-media-section` or `feature-media-item` identity

### Requirement: Responsive carousel content

The component SHALL render independently authored desktop/mobile titles and media, optional copy, and source-backed layout variants without empty placeholders.

#### Scenario: Optional fields are empty

- **WHEN** an optional title, unit, tag, description, note, link, or metric field is empty
- **THEN** the component omits that element and leaves no structural gap

#### Scenario: Media ratio selection

- **WHEN** the block selects 16:9, 2.35:1, or 4:3
- **THEN** both desktop and mobile media use that selected ratio

### Requirement: Grouped highlights

The component SHALL model `topList` as repeatable groups that contain repeatable highlight items and SHALL keep every authored group intact during responsive wrapping.

#### Scenario: Multiple highlight groups

- **WHEN** two or more highlight groups are authored
- **THEN** each group's items remain in their original group and the layout wraps whole groups

### Requirement: Attached bottom metrics

The component SHALL model `bottomList` separately from grouped highlights and SHALL display three or four authored metric items as a strip attached below the main media.

#### Scenario: Bottom metrics are authored

- **WHEN** the component contains bottom metric items
- **THEN** the media uses top corner rounding and the metric strip uses matching bottom corner rounding

### Requirement: Theme and spacing alignment

The component SHALL use the selected product theme colors and spacing presets at all supported breakpoints.

#### Scenario: Dark theme

- **WHEN** the block uses dark background and light copy
- **THEN** active tabs, inactive tabs, copy, and divider rules remain legible without hard-coded light-theme colors

#### Scenario: Spacing presets

- **WHEN** `space-large`, `space-small`, or `space-none` is selected
- **THEN** desktop spacing is respectively 160px, 80px, or 0 and mobile spacing is respectively 80px, 60px, or 0

### Requirement: Accessible responsive tabs

The tab carousel SHALL provide unique ARIA relationships, keyboard navigation, desktop autoplay, manual mobile swipe, and reduced-motion protection.

#### Scenario: Multiple carousel instances

- **WHEN** multiple product intro carousels render on one page
- **THEN** every tab, panel, and copy ID is unique across the document

#### Scenario: Reduced motion

- **WHEN** the user requests reduced motion
- **THEN** automatic tab rotation remains stopped
