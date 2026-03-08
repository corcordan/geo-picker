import * as assert from 'assert';
import * as vscode from 'vscode';
import { insertCoordinate } from '../extension';

suite('Extension Test Suite', () => {
	let originalCreate: typeof vscode.window.createWebviewPanel;
	let savedCallback: ((msg: any) => any) | undefined;
	let fakePanel: any;

	suiteSetup(() => {
		originalCreate = vscode.window.createWebviewPanel;
	});

	suiteTeardown(() => {
		vscode.window.createWebviewPanel = originalCreate;
	});

	function stubCreatePanel() {
		savedCallback = undefined;
		fakePanel = {
			webview: {
				html: '',
				onDidReceiveMessage(callback: any) {
					savedCallback = callback;
					return { dispose() {} };
				}
			},
			disposed: false,
			dispose() { this.disposed = true; }
		};
		return fakePanel;
	}

	async function openDocument(language?: string) {
		const doc = await vscode.workspace.openTextDocument({ language: language || 'plaintext', content: '' });
		await vscode.window.showTextDocument(doc);
		return doc;
	}

	test('insertCoordinate helper inserts text at position', async () => {
		const doc = await openDocument();
		const editor = vscode.window.activeTextEditor!;
		await insertCoordinate(editor, new vscode.Position(0, 0), 10, 20, 'lat, lng', 4);
		assert.strictEqual(doc.getText(), '10.0000, 20.0000\n');
	});

	test('command creates panel and inserts coordinate', async () => {
		vscode.window.createWebviewPanel = () => stubCreatePanel();
		const doc = await openDocument();

		await vscode.commands.executeCommand('geoPicker.pickCoordinate');
		assert.ok(savedCallback, 'webview callback should be set');

		// simulate user selecting a point
		savedCallback!({ command: 'insert', lat: 1, lng: 2, format: 'lat, lng', precision: 4 });

		// give editor time to update
		await new Promise(resolve => setTimeout(resolve, 50));
		assert.strictEqual(doc.getText(), '1, 2\n');
		assert.strictEqual(fakePanel.disposed, true);
	});

	test('multiple insert messages append lines (rapid clicks)', async () => {
		vscode.window.createWebviewPanel = () => stubCreatePanel();
		const doc = await openDocument();

		await vscode.commands.executeCommand('geoPicker.pickCoordinate');
		assert.ok(savedCallback);

		// two quick messages
		savedCallback!({ command: 'insert', lat: 3, lng: 4, format: 'lat, lng', precision: 4 });
		savedCallback!({ command: 'insert', lat: 5, lng: 6, format: 'lat, lng', precision: 4 });

		await new Promise(resolve => setTimeout(resolve, 50));
		assert.strictEqual(doc.getText(), '3, 4\n5, 6\n');
	});

	test('message without coordinates does nothing', async () => {
		vscode.window.createWebviewPanel = () => stubCreatePanel();
		const doc = await openDocument();

		await vscode.commands.executeCommand('geoPicker.pickCoordinate');
		assert.ok(savedCallback);

		savedCallback!({ command: 'insert' });

		await new Promise(resolve => setTimeout(resolve, 50));
		assert.strictEqual(doc.getText(), '');
	});

	test('works in different file types', async () => {
		for (const lang of ['markdown', 'javascript', 'plaintext']) {
			vscode.window.createWebviewPanel = () => stubCreatePanel();
			const doc = await openDocument(lang);
			await vscode.commands.executeCommand('geoPicker.pickCoordinate');
			assert.ok(savedCallback);
			savedCallback!({ command: 'insert', lat: 7, lng: 8, format: 'lat, lng', precision: 4 });
			await new Promise(resolve => setTimeout(resolve, 50));
			assert.strictEqual(doc.getText(), '7.0000, 8.0000\n');
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		}
	});

	test('insertCoordinate formats correctly', async () => {
		const doc = await openDocument();
		const editor = vscode.window.activeTextEditor!;

		await insertCoordinate(editor, new vscode.Position(0, 0), 37.7749, -122.4194, 'lat, lng', 4);
		assert.strictEqual(doc.getText(), '37.7749, -122.4194\n');

		await insertCoordinate(editor, new vscode.Position(1, 0), 37.7749, -122.4194, 'lng, lat', 5);
		assert.strictEqual(doc.getText(), '37.7749, -122.4194\n-122.41940, 37.77490\n');

		await insertCoordinate(editor, new vscode.Position(2, 0), 37.7749, -122.4194, '[lat, lng]', 6);
		assert.strictEqual(doc.getText(), '37.7749, -122.4194\n-122.41940, 37.77490\n[37.774900, -122.419400]\n');

		await insertCoordinate(editor, new vscode.Position(3, 0), 37.7749, -122.4194, '{lat: x, lng: y}', 4);
		assert.strictEqual(doc.getText(), '37.7749, -122.4194\n-122.41940, 37.77490\n[37.774900, -122.419400]\n{lat: 37.7749, lng: -122.4194}\n');
	});

	test('clipboard is written with formatted text', async () => {
		let clipboardText = '';
		const originalWrite = vscode.env.clipboard.writeText;
		vscode.env.clipboard.writeText = (text: string) => { clipboardText = text; return Promise.resolve(); };

		const doc = await openDocument();
		const editor = vscode.window.activeTextEditor!;
		await insertCoordinate(editor, new vscode.Position(0, 0), 10, 20, '[lat, lng]', 4);
		assert.strictEqual(clipboardText, '[10.0000, 20.0000]');

		vscode.env.clipboard.writeText = originalWrite;
	});
});