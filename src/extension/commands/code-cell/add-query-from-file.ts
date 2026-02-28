import * as vscode from "vscode";
import * as path from 'path';

export async function addQueryFromFile(cell: vscode.NotebookCell) {
    const activeNotebook = cell.notebook;

    if (!activeNotebook) {
        console.warn('No active notebook');
        return;
    }

    const CREATE_NEW = '$(add) Create new query file';
    const SELECT_EXISTING = '$(file) Select existing query file';

    const choice = await vscode.window.showQuickPick([SELECT_EXISTING, CREATE_NEW], {
        placeHolder: 'Select an existing SPARQL query file or create a new one'
    });

    if (!choice) {
        return;
    }

    if (choice === SELECT_EXISTING) {
        await selectExistingFile(cell, activeNotebook);
    } else if (choice === CREATE_NEW) {
        await createNewFile(cell, activeNotebook);
    }
}

async function selectExistingFile(cell: vscode.NotebookCell, activeNotebook: vscode.NotebookDocument) {
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
        const sparqlFilePath = fileUri[0].fsPath;
        try {
            const relativeSparqlFilePath = path.relative(path.dirname(activeNotebook.uri.fsPath), sparqlFilePath).replace(/\\/g, '/');
            const notebookFilePath = activeNotebook.uri.fsPath;
            const notebookFilename = path.basename(activeNotebook.uri.fsPath);
            const notebookPathWithoutFilename = notebookFilePath.replace(new RegExp(`${notebookFilename}$`), '');
            const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(notebookPathWithoutFilename + relativeSparqlFilePath));

            const newCell = new vscode.NotebookCellData(vscode.NotebookCellKind.Code, `# from file ${relativeSparqlFilePath}\n${(await fileContent).toString()}`, 'sparql');

            newCell.metadata = {
                file: relativeSparqlFilePath
            };
            // Logic to add the notebook cell using the fileContent
            const notebookEdit = vscode.NotebookEdit.replaceCells(new vscode.NotebookRange(cell.index, cell.index + 1), [newCell]);
            const edit = new vscode.WorkspaceEdit();
            edit.set(activeNotebook.uri, [notebookEdit]);
            vscode.workspace.applyEdit(edit);
        } catch (error) {
            // Handle file read error
            vscode.window.showErrorMessage(`Error reading file ${sparqlFilePath}: ${error}`);
            console.error('Error reading file:', error);
        }

    } else {
        // User cancelled the file open dialog
        // Handle accordingly
    }
}

async function createNewFile(cell: vscode.NotebookCell, activeNotebook: vscode.NotebookDocument) {
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
        saveLabel: 'Create Query',
        title: 'Create New SPARQL Query File'
    });

    if (!newFileUri) {
        return; // User cancelled
    }

    try {
        const initialContent = Buffer.from('# SPARQL Query\n');
        await vscode.workspace.fs.writeFile(newFileUri, initialContent);

        // Calculate relative path for the cell metadata
        const notebookDirPath = path.dirname(activeNotebook.uri.fsPath);
        const relativeSparqlFilePath = path.relative(notebookDirPath, newFileUri.fsPath).replace(/\\/g, '/');

        const newCell = new vscode.NotebookCellData(vscode.NotebookCellKind.Code, `# from file ${relativeSparqlFilePath}\n# SPARQL Query\n`, 'sparql');
        newCell.metadata = {
            file: relativeSparqlFilePath
        };

        const notebookEdit = vscode.NotebookEdit.replaceCells(new vscode.NotebookRange(cell.index, cell.index + 1), [newCell]);
        const edit = new vscode.WorkspaceEdit();
        edit.set(activeNotebook.uri, [notebookEdit]);
        vscode.workspace.applyEdit(edit);

    } catch (error) {
        vscode.window.showErrorMessage(`Error creating file ${newFileUri.fsPath}: ${error}`);
        console.error('Error creating file:', error);
    }
}