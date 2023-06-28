import * as vscode from "vscode";

import { SparqlNotebookController } from "./sparql-notebook-controller";
import { EndpointConfiguration, EndpointConnections } from "./sparql-connection-menu";

import {
  addNewConnectionConfiguration,
  connectToDatabase,
  deleteConnectionConfiguration,
} from "./commands";

import { exportToMarkdown } from "./export-command";

import { SparqlNotebookSerializer } from "./file-io";

export const storageKey = "sparql-notebook-connections";

export const globalConnection: { connection: EndpointConnection | null } = {
  connection: null,
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer(
      "sparql-notebook",
      new SparqlNotebookSerializer()
    )
  );

  const sparqlNotebookController = new SparqlNotebookController();
  context.subscriptions.push(sparqlNotebookController);

  const connectionsSidepanel = new EndpointConnections(context);
  vscode.window.registerTreeDataProvider(storageKey, connectionsSidepanel);

  vscode.commands.registerCommand(
    "sparql-notebook.deleteConnectionConfiguration",
    deleteConnectionConfiguration(context, connectionsSidepanel)
  );

  vscode.commands.registerCommand(
    "sparql-notebook.addNewConnectionConfiguration",
    addNewConnectionConfiguration(context, connectionsSidepanel)
  );
  vscode.commands.registerCommand(
    "sparql-notebook.connect",
    connectToDatabase(context, connectionsSidepanel)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "sparql-notebook.exportToMarkdown",
      exportToMarkdown
    )
  );

  vscode.commands.registerCommand(
    "sparql-notebook.addQueryFromFile",
    addQueryFromFile
  );
}

export function deactivate() { }

export interface EndpointConnection {
  data: EndpointConfiguration;
}

async function addQueryFromFile(cell: vscode.NotebookCell) {
  const activeNotebook = cell.notebook;

  if (activeNotebook) {
    const options = {
      canSelectFiles: true,
      canSelectMany: false,
      filters: {
        'SPARQL Query Files': ['sparql', 'rq'],
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



