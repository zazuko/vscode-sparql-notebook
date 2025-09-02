import { NotebookCell, NotebookCellData, NotebookCellKind, NotebookEdit, NotebookRange, Uri, window, workspace, WorkspaceEdit } from "vscode";
import * as path from 'path';

export async function addQueryFromFile(cell: NotebookCell) {
    const activeNotebook = cell.notebook;

    if (activeNotebook) {
        const options = {
            canSelectFiles: true,
            canSelectMany: false,
            filters: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'SPARQL Query Files': ['sparql', 'rq'],

                // eslint-disable-next-line @typescript-eslint/naming-convention
                'All Files': ['*']
            }
        };

        const fileUri = await window.showOpenDialog(options);
        if (fileUri && fileUri.length > 0) {
            const sparqlFilePath = fileUri[0].fsPath;
            const activeNotebook = window.activeNotebookEditor?.notebook;
            if (!activeNotebook) {
                console.warn('No active notebook');
                return;
            }
            try {
                const relativeSparqlFilePath = path.relative(path.dirname(activeNotebook.uri.fsPath), sparqlFilePath).replace(/\\/g, '/');
                const notebookFilePath = activeNotebook.uri.fsPath;
                const notebookFilename = path.basename(activeNotebook.uri.fsPath);
                const notebookPathWithoutFilename = notebookFilePath.replace(new RegExp(`${notebookFilename}$`), '');
                const fileContent = await workspace.fs.readFile(Uri.file(notebookPathWithoutFilename + relativeSparqlFilePath));

                const newCell = new NotebookCellData(NotebookCellKind.Code, `# from file ${relativeSparqlFilePath}\n${(await fileContent).toString()}`, 'sparql');

                newCell.metadata = {
                    file: relativeSparqlFilePath
                };
                // Logic to add the notebook cell using the fileContent
                const notebookEdit = NotebookEdit.replaceCells(new NotebookRange(cell.index, cell.index + 1), [newCell]);
                const edit = new WorkspaceEdit();
                edit.set(activeNotebook.uri, [notebookEdit]);
                workspace.applyEdit(edit);
            } catch (error) {
                // Handle file read error
                window.showErrorMessage(`Error reading file ${sparqlFilePath}: ${error}`);
                console.error('Error reading file:', error);
            }

        } else {
            // User cancelled the file open dialog
            // Handle accordingly
        }
    }

}