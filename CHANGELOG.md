# Change Log

All notable changes to the "geo-picker" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.0.0] - 2026-03-08

### Added

- Initial release: pick and insert latitude/longitude coordinates via a map.
- Support for multiple output formats: `lat, lng`, `lng, lat`, `[lat, lng]`, `[lng, lat]`, `{lat: x, lng: y}`.
- Configurable decimal precision (4-6 places).
- Automatic clipboard copying of inserted coordinates.

## [1.0.2] - 2026-03-09

### Added

- Real-time preview of expected coordinate output in the map panel
- Extension icon in VS Code marketplace

### Fixed

- Removed trailing newline when inserting coordinates
- Icon not displaying due to missing package.json reference

## [Unreleased]

- Add GIF demonstrations to README