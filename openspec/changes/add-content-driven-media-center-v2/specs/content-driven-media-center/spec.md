## ADDED Requirements

### Requirement: Detail-record driven media feed

The system SHALL build a v2 media list from published detail records under a configured root path rather than from page-local card rows.

#### Scenario: Visible newsroom record

- **WHEN** a published detail record has `mediaType=newsroom` and `visible=true`
- **THEN** the Newsroom v2 route renders its title, cover image, date, and detail link.

#### Scenario: Hidden record

- **WHEN** a detail record has `visible=false`
- **THEN** no v2 media list renders that record.

### Requirement: Configurable feed placement

The system SHALL render each visible record in its configured feed placement.

#### Scenario: Full-width record

- **WHEN** a detail record has `displayMode=full-width`
- **THEN** the desktop feed renders that card across both grid columns.
