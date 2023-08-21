import * as vscode from "vscode";


export async function addQueryFromFile(cell: vscode.NotebookCell) {
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

        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri.length > 0) {
            const filePath = fileUri[0].fsPath;
            const relativeFilePath = vscode.workspace.asRelativePath(filePath);

            try {
                const fileContent = vscode.workspace.fs.readFile(fileUri[0]);
                const newCell = new vscode.NotebookCellData(vscode.NotebookCellKind.Code, `# from file ${relativeFilePath}\n${(await fileContent).toString()}`, 'sparql');
                newCell.metadata = {
                    file: filePath
                };
                // Logic to add the notebook cell using the fileContent
                const notebookEdit = vscode.NotebookEdit.replaceCells(new vscode.NotebookRange(cell.index, cell.index + 1), [newCell]);
                const edit = new vscode.WorkspaceEdit();
                edit.set(activeNotebook.uri, [notebookEdit]);
                vscode.workspace.applyEdit(edit);
            } catch (error) {
                // Handle file read error
                vscode.window.showErrorMessage(`Error reading file ${relativeFilePath}: ${error}`);
                console.error('Error reading file:', error);
            }

        } else {
            // User cancelled the file open dialog
            // Handle accordingly
        }
    }

}