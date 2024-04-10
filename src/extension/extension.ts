import * as vscode from "vscode";

import { SparqlNotebookController } from "./notebook/sparql-notebook-controller";
import { EndpointConnections } from "./sparql-connection-menu";

import { SparqlNotebookSerializer } from "./notebook/file-io";

import { deleteConnection } from "./commands/sparql-connection/delete-connection";
import { addConnection } from "./commands/sparql-connection/add-connection";
import { connectToDatabase } from "./commands/sparql-connection/connect-to-database";

import { exportToMarkdown } from "./commands/export/export-to-markdown";
import { addQueryFromFile } from "./commands/code-cell/add-query-from-file";

import { activateFormProvider } from "./connection-view/connection-view";
import { createStoreFromFile } from "./commands/store-from-file/store-from-file";
import { SparqlNotebookCellStatusBarItemProvider } from './notebook/SparqlNotebookCellStatusBarItemProvider';

import * as path from "path";

export const extensionId = "sparql-notebook";
export const storageKey = `${extensionId}-connections`;

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer(
      extensionId,
      new SparqlNotebookSerializer()
    )
  );

  // register the notebook controller
  const sparqlNotebookController = new SparqlNotebookController();
  context.subscriptions.push(sparqlNotebookController);


  const sparqlNotebookCellStatusBarItemProvider = new SparqlNotebookCellStatusBarItemProvider();
  context.subscriptions.push(vscode.notebooks.registerNotebookCellStatusBarItemProvider(extensionId, sparqlNotebookCellStatusBarItemProvider));

  // register the connections sidepanel
  const connectionsSidepanel = new EndpointConnections(context);
  vscode.window.registerTreeDataProvider(storageKey, connectionsSidepanel);

  // activateFormProvider(context);
  /*
   {
            "type": "webview",
            "id": "sparql-notebook.connectionForm",
            "name": "New SPARQL Connection",
            "contextualTitle": "New Connection",
            "visibility": "visible"
          }
  */
  // register the commands
  // connection related commands
  vscode.commands.registerCommand(
    `${extensionId}.deleteConnectionConfiguration`,
    deleteConnection(context, connectionsSidepanel)
  );

  vscode.commands.registerCommand(
    `${extensionId}.addNewConnectionConfiguration`,
    addConnection(context, connectionsSidepanel)
  );
  vscode.commands.registerCommand(
    `${extensionId}.connect`,
    connectToDatabase(context, connectionsSidepanel, sparqlNotebookCellStatusBarItemProvider)
  );

  vscode.commands.registerCommand(
    `${extensionId}.createStoreFromFile`,
    createStoreFromFile(sparqlNotebookCellStatusBarItemProvider)
  );

  //  export related commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${extensionId}.exportToMarkdown`,
      exportToMarkdown
    )
  );

  // code cell related commands
  vscode.commands.registerCommand(
    `${extensionId}.addQueryFromFile`,
    addQueryFromFile
  );


  // load external notebook files
  // Execute code after a notebook is loaded
  // Register the onDidChangeNotebookDocument event
  context.subscriptions.push(vscode.workspace.onDidOpenNotebookDocument(notebookDocument => {
    // Check if the notebook is a SPARQL Notebook
    if (notebookDocument.notebookType !== extensionId) {
      return;
    }
    // reload the cells with external query file content
    // this have to be done here because we work with relative query file path
    // and the notebook path is not available in the deserializer
    const notebookPath = notebookDocument.uri.fsPath;
    const notebookDirectory = path.dirname(notebookPath);

    // cells with a file metadata
    notebookDocument.getCells().filter(cell => cell.kind === vscode.NotebookCellKind.Code && cell.metadata.file).forEach(async cell => {
      const activeNotebook = cell.notebook;

      if (activeNotebook) {
        const sparqlFilePath = cell.metadata.file.replace(/\\/g, '/');

        try {
          let relativeSparqlFilePath = sparqlFilePath;
          if (path.isAbsolute(sparqlFilePath)) {
            relativeSparqlFilePath = path.relative(notebookDirectory, sparqlFilePath);
            console.log('rel path', path.relative(notebookPath, sparqlFilePath));
          }


          const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(path.join(notebookDirectory, relativeSparqlFilePath)));
          const newCell = new vscode.NotebookCellData(vscode.NotebookCellKind.Code, `# from file ${relativeSparqlFilePath}\n${(await fileContent).toString()}`, 'sparql');

          newCell.metadata = {
            file: relativeSparqlFilePath
          };
          // Logic to add the notebook cell using the fileContent
          const notebookEdit = vscode.NotebookEdit.replaceCells(new vscode.NotebookRange(cell.index, cell.index + 1), [newCell]);
          const edit = new vscode.WorkspaceEdit();
          edit.set(notebookDocument.uri, [notebookEdit]);
          vscode.workspace.applyEdit(edit);
        } catch (error) {
          // Handle file read error
          vscode.window.showErrorMessage(`Error reading file ${sparqlFilePath}: ${error}\n$Reset the file path for the cell. ${cell.index}`);
          console.error('Error reading file:', error);
        }
      }
    });
  }));

  context.subscriptions.push(vscode.workspace.onDidSaveNotebookDocument(notebookDocument => {
    // Check if the notebook is a SPARQL Notebook
    if (notebookDocument.notebookType !== extensionId) {
      return;
    }
    // write query files here 
    const notebookPath = notebookDocument.uri.fsPath;
    const notebookDirectory = path.dirname(notebookPath);

    // cells with a file metadata
    notebookDocument.getCells().filter(cell => cell.kind === vscode.NotebookCellKind.Code && cell.metadata.file).forEach(async cell => {
      const activeNotebook = cell.notebook;
      if (activeNotebook) {
        const sparqlFilePath = cell.metadata.file.replace(/\\/g, '/');
        try {
          let relativeSparqlFilePath = sparqlFilePath;
          if (path.isAbsolute(sparqlFilePath)) {
            relativeSparqlFilePath = path.relative(notebookDirectory, sparqlFilePath);
          }

          const sparqlQuery = cell.document.getText().replace(/^# from file.*\n/, '');
          const content = Buffer.from(sparqlQuery, 'utf-8');
          await vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(notebookDirectory, sparqlFilePath)), content);


        } catch (error) {
          vscode.window.showErrorMessage(`Error writing file: ${sparqlFilePath}: ${error}`);
          console.error('Error writing file:', error);
        }

      }
    });
  }));

};

// this method is called when your extension is deactivated
export function deactivate() { }
