import * as vscode from "vscode";
import * as path from 'path';

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
                'SHACL Files': ['shacl', 'ttl'],
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'All Files': ['*']
            }
        };

        const fileUri = await vscode.window.showOpenDialog(options);
        if (fileUri && fileUri.length > 0) {
            const filePath = fileUri[0].fsPath;
            const activeNotebook = vscode.window.activeNotebookEditor?.notebook;
            if (!activeNotebook) {
                console.warn('No active notebook');
                return;
            }
            try {
                const relativeFilePath = path.relative(path.dirname(activeNotebook.uri.fsPath), filePath).replace(/\\/g, '/');
                const notebookFilePath = activeNotebook.uri.fsPath;
                const notebookFilename = path.basename(activeNotebook.uri.fsPath);
                const notebookPathWithoutFilename = notebookFilePath.replace(new RegExp(`${notebookFilename}$`), '');
                const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(notebookPathWithoutFilename + relativeFilePath));

                // Determine language based on file extension
                const ext = path.extname(filePath).toLowerCase();
                const languageId = (ext === '.shacl' || ext === '.ttl') ? 'shacl' : 'sparql';

                const newCell = new vscode.NotebookCellData(vscode.NotebookCellKind.Code, `# from file ${relativeFilePath}\n${(await fileContent).toString()}`, languageId);

                newCell.metadata = {
                    file: relativeFilePath
                };
                // Logic to add the notebook cell using the fileContent
                const notebookEdit = vscode.NotebookEdit.replaceCells(new vscode.NotebookRange(cell.index, cell.index + 1), [newCell]);
                const edit = new vscode.WorkspaceEdit();
                edit.set(activeNotebook.uri, [notebookEdit]);
                vscode.workspace.applyEdit(edit);
            } catch (error) {
                // Handle file read error
                vscode.window.showErrorMessage(`Error reading file ${filePath}: ${error}`);
                console.error('Error reading file:', error);
            }

        } else {
            // User cancelled the file open dialog
            // Handle accordingly
        }
    }

}