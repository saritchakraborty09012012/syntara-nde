const vscode = require('vscode');

async function askSyntara(prompt) {
  const cfg = vscode.workspace.getConfiguration('syntara');
  const baseUrl = (cfg.get('baseUrl') || 'http://127.0.0.1:8000/v1').replace(/\/$/, '');
  const model = cfg.get('model') || '';
  if (!model) throw new Error('Set syntara.model in VS Code settings first.');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], stream: false })
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  const body = await response.json();
  return body.choices?.[0]?.message?.content || '';
}

async function openWebChat(cfg) {
  const webUrl = (cfg.get('webUrl') || 'http://localhost:5173').replace(/\/$/, '');
  await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${webUrl}/`));
  return webUrl;
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('syntara.openChat', async () => {
      const cfg = vscode.workspace.getConfiguration('syntara');
      try {
        const url = await openWebChat(cfg);
        vscode.window.showInformationMessage(`Opened the Syntara dashboard at ${url}.`);
      } catch (error) {
        vscode.window.showWarningMessage(`Could not open the web dashboard (${error.message || error}). Start it with the web app and set syntara.webUrl accordingly.`);
      }
    }),
    vscode.commands.registerCommand('syntara.sendSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      const text = editor?.document.getText(editor.selection)?.trim();
      if (!text) return vscode.window.showWarningMessage('Select some text first.');
      try {
        const result = await askSyntara(text);
        await vscode.env.clipboard.writeText(result);
        vscode.window.showInformationMessage('Syntara response copied to clipboard.');
      } catch (error) {
        vscode.window.showErrorMessage(`Syntara: ${error.message || error}`);
      }
    }),
    vscode.commands.registerCommand('syntara.explainSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      const text = editor?.document.getText(editor.selection)?.trim();
      if (!text) return vscode.window.showWarningMessage('Select some code first.');
      try {
        const result = await askSyntara(`Explain this code clearly and concisely:\n\n${text}`);
        const doc = await vscode.workspace.openTextDocument({ content: result, language: 'markdown' });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (error) {
        vscode.window.showErrorMessage(`Syntara: ${error.message || error}`);
      }
    })
  );
}

function deactivate() {}
module.exports = { activate, deactivate };
