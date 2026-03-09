# Geo Picker

**Geo Picker** is a lightweight VS Code extension that lets you choose a point on an interactive map and automatically inserts the corresponding latitude/longitude pair into the active editor.


## Features

* Open an interactive map panel beside the editor.
* Click anywhere on the map to drop a marker.
* Preview the expected coordinate output before insertion.
* Use the **Insert Coordinate** button to write `lat, lng` at the original cursor location.
* Choose between different formatting options: `lat, lng`, `lng, lat`, `[lat, lng]`, `[lng, lat]`, and `{lat: x, lng: y}`.
* Choose the decimal precision (4-6).
* Coordinate automatically copied to clipboard.
* Accessible via the command palette or the editor context menu.


## Requirements

* None – the extension is written in TypeScript and loads Leaflet via CDN.
* An internet connection is required to fetch OpenStreetMap tiles and Leaflet resources.


## Usage

1. Open a text file and place the cursor where you want coordinates inserted.
2. Invoke the **Add Coordinate** command from the palette (`Cmd+Shift+P` ➜ *Add Coordinate*) or right-click in the editor and choose *Add Coordinate*.
3. A map panel opens side-by-side. Click a point on the map to select it.
4. Choose your preferred **format** (e.g., `lat, lng`, `[lat, lng]`, `{lat: x, lng: y}`) and **precision** (4-6 decimal places).
5. Preview the **Expected Output** field to see exactly what will be inserted.
6. Press **Insert Coordinate** – the formatted coordinate is inserted at the cursor and copied to your clipboard.

> You may open multiple maps simultaneously; each returns coordinates independently of the others.


## Extension Settings

This extension does not contribute any user-configurable settings.


## Known Issues

* Map tiles require an active internet connection.
* Only decimal‑degree coordinates are supported at the moment.


## Release Notes

### 1.0.2

- Fixed minor mistakes in documentation

### 1.0.1

- Added real-time preview of expected coordinate output in the map panel
- Fixed icon display in VS Code marketplace
- Removed trailing newline when inserting coordinates

### 1.0.0

Initial release – pick and insert latitude/longitude coordinates via a map.


## Tips

Consider adding a screenshot or animated GIF in an `images/` folder and reference it here:

```
![example](images/preview.gif)
```

