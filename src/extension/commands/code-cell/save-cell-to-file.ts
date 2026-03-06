import * as vscode from "vscode";
import * as path from 'path';

export async function saveCellToFile(cell: vscode.NotebookCell) {
    const activeNotebook = cell.notebook;

    if (!activeNotebook) {
        console.warn('No active notebook');
        return;
    }

    const notebookDir = vscode.Uri.file(path.dirname(activeNotebook.uri.fsPath));
    const defaultUri = vscode.Uri.joinPath(notebookDir, 'query.rq');

    const newFileUri = await vscode.window.showSaveDialog({
        defaultUri: defaultUri,
        filters: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'SPARQL Query Files': ['rq', 'sparql'],
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'All Files': ['*']
        },
        saveLabel: 'Save Query',
        title: 'Save Cell to New File'
    });

    if (!newFileUri) {
        return; // User cancelled
    }

    try {
        const cellContent = cell.document.getText();
        const contentBuffer = Buffer.from(cellContent);
        await vscode.workspace.fs.writeFile(newFileUri, contentBuffer);

        // Calculate relative path for the cell metadata
        const notebookDirPath = path.dirname(activeNotebook.uri.fsPath);
        const relativeSparqlFilePath = path.relative(notebookDirPath, newFileUri.fsPath).replace(/\\/g, '/');

        // Note: We use the existing cell content, but add a comment if needed or just use the content verbatim.
        // It's usually better to just use the actual cell content as-is, which we already have.
        // However, standard addQueryFromFile adds '# from file X' comment at the top. Let's do the same for consistency?
        // Actually, no. We are saving the user's explicit content. If we modify it, they might be annoyed. 
        // But `addQueryFromFile` has that comment. Let's just create a NotebookCellData with the existing content
        // and link the file metadata.
        const newCell = new vscode.NotebookCellData(cell.kind, cellContent, cell.document.languageId);
        // preserve the old metadata but update the file property
        newCell.metadata = {
            ...cell.metadata,
            file: relativeSparqlFilePath
        };
        newCell.outputs = cell.outputs.map(out => new vscode.NotebookCellOutput(out.items.map(item => new vscode.NotebookCellOutputItem(item.data, item.mime)), out.metadata));

        const notebookEdit = vscode.NotebookEdit.replaceCells(new vscode.NotebookRange(cell.index, cell.index + 1), [newCell]);
        const edit = new vscode.WorkspaceEdit();
        edit.set(activeNotebook.uri, [notebookEdit]);
        vscode.workspace.applyEdit(edit);

    } catch (error) {
        vscode.window.showErrorMessage(`Error saving to file ${newFileUri.fsPath}: ${error}`);
        console.error('Error saving file:', error);
    }
}
