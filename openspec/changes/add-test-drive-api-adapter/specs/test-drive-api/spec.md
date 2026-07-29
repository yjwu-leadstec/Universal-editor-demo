## ADDED Requirements

### Requirement: Safe Test Drive API Activation

The Test Drive booking component SHALL access the external Li Auto lead API only
when runtime mode is explicitly set to `ontest`. Authored content and the
default deployed page SHALL NOT enable an external write.

#### Scenario: Default page submission

- **WHEN** the component has no runtime API mode
- **THEN** it sends no request to the Li Auto lead API
- **AND** the form remains recoverable through its existing error UI

#### Scenario: Explicit ontest activation

- **WHEN** runtime mode is `ontest` and every required business value is valid
- **THEN** the component may use the configured ontest client
- **AND** every request uses a fresh trace ID and the documented headers

### Requirement: Documented Lead Payload Mapping

The adapter SHALL map booking values to the documented overseas lead payload
and SHALL reject missing or unmapped business values before a write request.

#### Scenario: Known model and store

- **WHEN** the form selects a documented model and current KZ store
- **THEN** the payload contains their Li Auto `vehicleSeries` and `storeCode`
- **AND** customer name, email, optional phone, country code, source, language,
  device ID, agreement ID, and agreement version use the documented fields

#### Scenario: Unmapped store

- **WHEN** the selected store has no current API code
- **THEN** submission fails before the external write
- **AND** no substitute store code is guessed

### Requirement: Store Query and API Result Handling

The adapter SHALL support read-only store lookup and SHALL interpret both HTTP
status and Li Auto API response codes.

#### Scenario: Store query succeeds

- **WHEN** the KZ store endpoint returns API code `0`
- **THEN** the client returns the normalized `code` and `name` entries

#### Scenario: Lead creation succeeds

- **WHEN** `/leads/add` returns API code `0`
- **THEN** the booking flow enters its existing success state

#### Scenario: Challenge is required

- **WHEN** `/leads/add` returns API code `600003`
- **THEN** the client returns a typed challenge-required failure
- **AND** the booking form remains recoverable

### Requirement: Captcha Retry Request

The adapter SHALL expose the documented captcha retry request without embedding
an unapproved captcha token provider.

#### Scenario: Challenge token is supplied

- **WHEN** an authorized integration supplies a non-empty challenge token
- **THEN** the client posts the same lead payload to
  `/leads/add-with-captcha`
- **AND** sends `Challenge-Authorization: Bearer <token>`

#### Scenario: Challenge token is absent

- **WHEN** captcha retry is requested without a token
- **THEN** the adapter fails before network access

### Requirement: Ephemeral Customer Data

The component SHALL keep customer form values ephemeral.

#### Scenario: Booking data is processed

- **WHEN** the user validates or submits the form
- **THEN** PII is not written to browser storage, cookies, console output, or
  smoke-test output
