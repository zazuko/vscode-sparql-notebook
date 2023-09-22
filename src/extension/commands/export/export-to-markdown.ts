import { promises as fs } from "fs";
import * as vscode from "vscode";
import { TextEncoder } from "util";

import { SparqlNotebookSerializer } from "../../notebook/file-io";

async function loadNotebook(uri: vscode.Uri) {
    const data = await fs.readFile(uri.fsPath);
    const nbSerialiser = new SparqlNotebookSerializer();
    const source = new vscode.CancellationTokenSource();
    const token = source.token;
    const nbData = nbSerialiser.deserializeNotebook(data, token);
    return nbData;
}

export const exportToMarkdown = async (documentToExportUri: vscode.Uri) => {
    if (!documentToExportUri) {
        return;
    }
    const currentNotebook = await loadNotebook(documentToExportUri);

    if (currentNotebook) {
        let markdown = "";

        const cells = currentNotebook.cells;
        cells.forEach((cell) => {
            if (cell.kind === vscode.NotebookCellKind.Markup) {
                markdown += `${cell.value}\n`;
            } else if (cell.kind === vscode.NotebookCellKind.Code) {
                let sparqlQuery = cell.value;
                if (cell.metadata?.file) {
                    sparqlQuery = cell.value.replace(/^# from file.*\n/, '');
                }
                markdown += `\n\`\`\`sparql\n${sparqlQuery}\n\`\`\`\n`;
            }
        });
        const newDocUri = vscode.Uri.file(`${documentToExportUri?.fsPath}.md`);
        await vscode.workspace.fs.writeFile(
            newDocUri,
            new TextEncoder().encode(markdown)
        );
    }
};
