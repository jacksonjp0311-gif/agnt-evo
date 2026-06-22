# Changelog

## 0.4.0 — 2026-06-17

### Added
- `open-url-native-plus`: build `baseUrl` + `queryJson` (URL-encoded) and open externally.
- `open-url-native` enhancements:
  - browser targeting (`default | chrome | edge | firefox`, best-effort)
  - optional profile + new-window flags (best-effort)
  - rate limiting (`maxLaunches` per `windowSeconds`)

### Notes
- `open-url-native` still requires `confirm=true` as a safety gate.

## 0.3.0 — 2026-06-17

### Added
- `open-url-native`: open URLs in the external system browser.
- `authorize-button`: one-click authorize widget for webhook workflows.

### Included
- `open-url`: link + iframe helper.
