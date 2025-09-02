import {
    Uri,
    workspace,
    CancellationTokenSource,
    NotebookCellKind
} from "vscode";

import { SparqlNotebookSerializer } from "../../notebook/file-io";

async function loadNotebook(uri: Uri) {
    const data = await workspace.fs.readFile(uri);
    const nbSerialiser = new SparqlNotebookSerializer();
    const source = new CancellationTokenSource();
    const token = source.token;
    const nbData = nbSerialiser.deserializeNotebook(data, token);
    return nbData;
}

export const exportToMarkdown = async (documentToExportUri: Uri) => {
    if (!documentToExportUri) {
        return;
    }
    const currentNotebook = await loadNotebook(documentToExportUri);

    if (currentNotebook) {
        let markdown = "";

        const cells = currentNotebook.cells;
        cells.forEach((cell) => {
            if (cell.kind === NotebookCellKind.Markup) {
                markdown += `${cell.value}\n`;
            } else if (cell.kind === NotebookCellKind.Code) {
                let sparqlQuery = cell.value;
                if (cell.metadata?.["file"]) {
                    sparqlQuery = cell.value.replace(/^# from file.*\n/, '');
                }
                markdown += `\n\`\`\`sparql\n${sparqlQuery}\n\`\`\`\n`;
            }
        });
        const newDocUri = Uri.file(`${documentToExportUri?.fsPath}.md`);
        await workspace.fs.writeFile(
            newDocUri,
            new TextEncoder().encode(markdown)
        );
    }
};
