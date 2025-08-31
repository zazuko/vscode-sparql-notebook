import * as vscode from "vscode";

import { SparqlNotebookController } from "./notebook/sparql-notebook-controller";
import { EndpointConnectionTreeDataProvider } from "./sparql-connection-menu/endpoint-tree-data-provider.class";

import { SparqlNotebookSerializer } from "./notebook/file-io";

import { deleteConnection } from "./commands/sparql-connection/delete-connection";
import { addConnection } from "./commands/sparql-connection/add-connection";
import { connectToEndpoint } from "./commands/sparql-connection/connect-to-endpoint";

import { exportToMarkdown } from "./commands/export/export-to-markdown";
import { addQueryFromFile } from "./commands/code-cell/add-query-from-file";

import { createStoreFromFile } from "./commands/store-from-file/store-from-file";
import { SparqlNotebookCellStatusBarItemProvider } from './notebook/SparqlNotebookCellStatusBarItemProvider';

import * as path from "path";
import { EndpointConnectionListItem } from "./sparql-connection-menu/endpoint-connection-list-item.class";
import { connectionConfigurationManager } from "./connection/connectioin-configuration";
import { EndpointEditorPanel } from "./ui/editor/editor-panel";


export const extensionId = "sparql-notebook";
export const storageKey = `${extensionId}-connections`;
export const connectionManager = connectionConfigurationManager;

/**
 * Activate the extension.
 * 
 * @param context activate the form provider
 */
export async function activate(context: vscode.ExtensionContext) {
  await connectionManager.initialize(context);

  const connectionsSidepanel = new EndpointConnectionTreeDataProvider();
  const sparqlNotebookCellStatusBarItemProvider = new SparqlNotebookCellStatusBarItemProvider();

  // Instantiate the EndpointEditorPanel class
  const endpointEditorPanel = new EndpointEditorPanel(context, connectionsSidepanel, sparqlNotebookCellStatusBarItemProvider,
  );

  // Register command to show the endpoint editor webview
  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${extensionId}.showEndpointEditor`,
      () => endpointEditorPanel.showPanel()
    )
  );

  // register the sparql notebook serializer
  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer(
      extensionId,
      new SparqlNotebookSerializer()
    )
  );

  // register the notebook controller
  const sparqlNotebookController = new SparqlNotebookController();
  context.subscriptions.push(sparqlNotebookController);

  // register the cell status bar item provider
  context.subscriptions.push(vscode.notebooks.registerNotebookCellStatusBarItemProvider(extensionId, sparqlNotebookCellStatusBarItemProvider));

  // register the connections sidepanel
  vscode.window.registerTreeDataProvider(storageKey, connectionsSidepanel);

  vscode.commands.registerCommand(
    `${extensionId}.deleteConnectionConfiguration`,
    deleteConnection(context, connectionsSidepanel)
  );

  vscode.commands.registerCommand(
    `${extensionId}.addNewConnectionConfiguration`,
    addConnection(endpointEditorPanel)
  );
  vscode.commands.registerCommand(
    `${extensionId}.connect`,
    connectToEndpoint(context, connectionsSidepanel, sparqlNotebookCellStatusBarItemProvider)
  );

  const treeView = vscode.window.createTreeView('sparql-notebook-connections', {
    treeDataProvider: connectionsSidepanel
  });

  treeView.onDidChangeSelection(e => {
    const selected = e.selection[0] as EndpointConnectionListItem | undefined;

    if (selected && selected.config) {
      endpointEditorPanel.showPanel();
      endpointEditorPanel.editConnection(selected.config);

    }
  });

  // create store from file
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
    notebookDocument.getCells().filter(cell => cell.kind === vscode.NotebookCellKind.Code && cell.metadata["file"]).forEach(async cell => {
      const activeNotebook = cell.notebook;

      if (activeNotebook) {
        const sparqlFilePath = cell.metadata['file'].replace(/\\/g, '/');

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
    notebookDocument.getCells().filter(cell => cell.kind === vscode.NotebookCellKind.Code && cell.metadata["file"]).forEach(async cell => {
      const activeNotebook = cell.notebook;
      if (activeNotebook) {
        const sparqlFilePath = cell.metadata["file"].replace(/\\/g, '/');
        try {
          let relativeSparqlFilePath = sparqlFilePath;
          if (path.isAbsolute(sparqlFilePath)) {
            relativeSparqlFilePath = path.relative(notebookDirectory, sparqlFilePath);
          }

          const sparqlQuery = cell.document.getText().replace(/^# from file.*[\r\n]/, '');
          const content = Buffer.from(sparqlQuery, 'utf-8');
          await vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(notebookDirectory, relativeSparqlFilePath)), content);


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
