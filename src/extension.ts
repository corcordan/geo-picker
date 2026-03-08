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
			<title>Pick a Coordinate</title>
			<style>
				body { font-family: Arial, sans-serif; padding: 10px; }
				select, button { margin: 5px; }
			</style>
		</head>
		<body>
			<h2>Click a point</h2>
			<div id="map" style="width:100%; height:300px; background:#ddd;">[Map Placeholder]</div>
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
			<button onclick="sendCoordinate()">Insert Coordinate</button>

			<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
				<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>

				<script>
				const vscode = acquireVsCodeApi();
				const map = L.map('map').setView([37.7749, -122.4194], 10);
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 19
				}).addTo(map);

				let marker;
				map.on('click', function(e) {
					if (marker) map.removeLayer(marker);
					marker = L.marker(e.latlng).addTo(map);
					window.selectedLatLng = e.latlng;
				});

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
			text = `${formattedLat}, ${formattedLng}\n`;
			break;
		case 'lng, lat':
			text = `${formattedLng}, ${formattedLat}\n`;
			break;
		case '[lat, lng]':
			text = `[${formattedLat}, ${formattedLng}]\n`;
			break;
		case '[lng, lat]':
			text = `[${formattedLng}, ${formattedLat}]\n`;
			break;
		case '{lat: x, lng: y}':
			text = `{lat: ${formattedLat}, lng: ${formattedLng}}\n`;
			break;
		default:
			text = `${formattedLat}, ${formattedLng}\n`;
	}

	await editor.edit(editBuilder => {
		editBuilder.insert(position, text);
	});

	await vscode.env.clipboard.writeText(text.trim());

	vscode.window.showInformationMessage("Coordinate inserted and copied to clipboard ✓");
}

