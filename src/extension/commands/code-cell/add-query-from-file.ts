import {
    NotebookCell,
    NotebookCellData,
    NotebookCellKind,
    NotebookEdit,
    NotebookRange,
    Uri,
    window,
    workspace,
    WorkspaceEdit
} from "vscode";

/**
 * Adds a SPARQL query from a file to the specified notebook cell.
 * 
 * @param cell The notebook cell to which the query will be added.
 * @returns A promise that resolves when the query has been added.
 */
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

                // Browser-compatible path operations
                const notebookFsPath = activeNotebook.uri.fsPath;
                // Get directory of notebook file
                const lastSlashIdx = notebookFsPath.lastIndexOf("/");
                const notebookDir = lastSlashIdx !== -1 ? notebookFsPath.substring(0, lastSlashIdx + 1) : "";
                // Compute relative path (simple fallback: if sparqlFilePath starts with notebookDir, strip it)
                let relativeSparqlFilePath = sparqlFilePath;
                if (sparqlFilePath.startsWith(notebookDir)) {
                    relativeSparqlFilePath = sparqlFilePath.substring(notebookDir.length);
                }
                relativeSparqlFilePath = relativeSparqlFilePath.replace(/\\/g, '/');
                // Read file content
                const fileContent = await workspace.fs.readFile(Uri.file(sparqlFilePath));

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