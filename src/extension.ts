// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('geoPicker.pickCoordinate', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            return;
        }

        const insertPosition = editor.selection.active;

        const panel = vscode.window.createWebviewPanel(
            'geoPicker',
            'Pick a Coordinate',
            vscode.ViewColumn.Beside,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'insert' && typeof message.lat === 'number' && typeof message.lng === 'number' && message.format && typeof message.precision === 'number') {
                await insertCoordinate(editor, insertPosition, message.lat, message.lng, message.format, message.precision);
                editor.revealRange(new vscode.Range(insertPosition, insertPosition));
                panel.dispose();
            }
        });
    });

    context.subscriptions.push(disposable);
}

export function getWebviewContent() {
	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https://*.tile.openstreetmap.org https: data:; script-src https://unpkg.com 'unsafe-inline'; style-src https://unpkg.com 'unsafe-inline'; font-src https://unpkg.com;">
			<title>Pick a Coordinate</title>
			<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
			<style>
				body { font-family: Arial, sans-serif; padding: 10px; }
				select, button { margin: 5px; }
				#map-container { position: relative; width: 100%; }
				#map { width: 100%; height: 300px; background: #ddd; }
				#map-resize-handle {
					width: 100%;
					height: 6px;
					cursor: ns-resize;
					background: #555;
					border-radius: 3px;
					margin-bottom: 8px;
				}
				#map-resize-handle:hover { background: #888; }
			</style>
		</head>
		<body>
			<h2>Click a point</h2>
			<div id="map-container">
				<div id="map"></div>
				<div id="map-resize-handle"></div>
			</div>
			<label for="format">Format:</label>
			<select id="format">
				<option value="lat, lng">lat, lng</option>
				<option value="lng, lat">lng, lat</option>
				<option value="[lat, lng]">[lat, lng]</option>
				<option value="[lng, lat]">[lng, lat]</option>
				<option value="{lat: x, lng: y}">{lat: x, lng: y}</option>
			</select>
			<label for="precision">Precision:</label>
			<select id="precision">
				<option value="4">4</option>
				<option value="5">5</option>
				<option value="6">6</option>
			</select>
			<div style="margin: 10px 0;">
				<strong>Expected Output:</strong><br>
				<input type="text" id="output" readonly style="width: 100%; padding: 5px; margin-top: 5px; font-family: monospace;">
			</div>
			<button onclick="sendCoordinate()">Insert Coordinate</button>

			<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
			<script>
				const vscode = acquireVsCodeApi();
				const map = L.map('map').setView([37.7749, -122.4194], 10);
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 19,
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				}).addTo(map);
				setTimeout(() => map.invalidateSize(), 100);

				const mapEl = document.getElementById('map');
				const handle = document.getElementById('map-resize-handle');
				let dragging = false;
				let startY = 0;
				let startHeight = 0;

				handle.addEventListener('mousedown', (e) => {
					dragging = true;
					startY = e.clientY;
					startHeight = mapEl.offsetHeight;
					document.body.style.userSelect = 'none';
				});

				document.addEventListener('mousemove', (e) => {
					if (!dragging) return;
					const newHeight = Math.max(150, startHeight + (e.clientY - startY));
					mapEl.style.height = newHeight + 'px';
					map.invalidateSize();
				});

				document.addEventListener('mouseup', () => {
					dragging = false;
					document.body.style.userSelect = '';
				});

				let marker;
				map.on('click', function(e) {
					if (marker) map.removeLayer(marker);
					marker = L.marker(e.latlng).addTo(map);
					window.selectedLatLng = e.latlng;
					updateOutput();
				});

				document.getElementById('format').addEventListener('change', updateOutput);
				document.getElementById('precision').addEventListener('change', updateOutput);

				function updateOutput() {
					if (window.selectedLatLng) {
						const format = document.getElementById('format').value;
						const precision = parseInt(document.getElementById('precision').value);
						const lat = window.selectedLatLng.lat.toFixed(precision);
						const lng = window.selectedLatLng.lng.toFixed(precision);
						let output = '';
						switch (format) {
							case 'lat, lng':
								output = \`\${lat}, \${lng}\`;
								break;
							case 'lng, lat':
								output = \`\${lng}, \${lat}\`;
								break;
							case '[lat, lng]':
								output = \`[\${lat}, \${lng}]\`;
								break;
							case '[lng, lat]':
								output = \`[\${lng}, \${lat}]\`;
								break;
							case '{lat: x, lng: y}':
								output = \`{lat: \${lat}, lng: \${lng}}\`;
								break;
							default:
								output = \`\${lat}, \${lng}\`;
						}
						document.getElementById('output').value = output;
					}
				}

				function sendCoordinate() {
					if(window.selectedLatLng){
					const format = document.getElementById('format').value;
					const precision = parseInt(document.getElementById('precision').value);
					vscode.postMessage({ command: 'insert', lat: window.selectedLatLng.lat, lng: window.selectedLatLng.lng, format: format, precision: precision });
					} else {
					alert('Click on the map first!');
					}
				}
			</script>
		</body>
		</html>
	`;
}

// This method is called when your extension is deactivated
export function deactivate() {}

/**
 * Insert a latitude/longitude pair into the given editor at the provided position.
 * Separated out for easier testing.
 */
export async function insertCoordinate(
	editor: vscode.TextEditor,
	position: vscode.Position,
	lat: number,
	lng: number,
	format: string,
	precision: number
) {
	const formattedLat = lat.toFixed(precision);
	const formattedLng = lng.toFixed(precision);
	let text: string;

	switch (format) {
		case 'lat, lng':
			text = `${formattedLat}, ${formattedLng}`;
			break;
		case 'lng, lat':
			text = `${formattedLng}, ${formattedLat}`;
			break;
		case '[lat, lng]':
			text = `[${formattedLat}, ${formattedLng}]`;
			break;
		case '[lng, lat]':
			text = `[${formattedLng}, ${formattedLat}]`;
			break;
		case '{lat: x, lng: y}':
			text = `{lat: ${formattedLat}, lng: ${formattedLng}}`;
			break;
		default:
			text = `${formattedLat}, ${formattedLng}`;
	}

	await editor.edit(editBuilder => {
		editBuilder.insert(position, text);
	});

	await vscode.env.clipboard.writeText(text.trim());

	vscode.window.showInformationMessage("Coordinate inserted and copied to clipboard ✓");
}

