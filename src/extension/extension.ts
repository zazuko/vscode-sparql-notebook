import {
  commands,
  ExtensionContext,
  workspace,
  notebooks,
  window,
  NotebookCellKind,
  WorkspaceEdit,
  NotebookEdit,
  NotebookRange,
  NotebookCellData,
  Uri
} from "vscode";

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

import { EndpointConnectionListItem } from "./sparql-connection-menu/endpoint-connection-list-item.class";
import { connectionConfigurationManager } from "./connection/connectioin-configuration";
import { EndpointEditorPanel } from "./ui/editor/editor-panel";


// Browser-compatible path utilities
function dirname(p: string): string {
  const idx = p.lastIndexOf("/");
  return idx !== -1 ? p.substring(0, idx) : ".";
}
function isAbsolute(p: string): boolean {
  return p.startsWith("/");
}
function join(...parts: string[]): string {
  return parts.join("/").replace(/\/+/g, "/");
}
function relative(from: string, to: string): string {
  if (to.startsWith(from)) {
    let rel = to.substring(from.length);
    if (rel.startsWith("/")) rel = rel.substring(1);
    return rel;
  }
  // fallback: just return to
  return to;
}


export const extensionId = "sparql-notebook";
export const storageKey = `${extensionId}-connections`;
export const connectionManager = connectionConfigurationManager;

/**
 * Activate the extension.
 * 
 * @param context activate the form provider
 */
export async function activate(context: ExtensionContext) {
  await connectionManager.initialize(context);

  const connectionsSidepanel = new EndpointConnectionTreeDataProvider();
  const sparqlNotebookCellStatusBarItemProvider = new SparqlNotebookCellStatusBarItemProvider();

  // Instantiate the EndpointEditorPanel class
  const endpointEditorPanel = new EndpointEditorPanel(context, connectionsSidepanel, sparqlNotebookCellStatusBarItemProvider,
  );

  // Register command to show the endpoint editor webview
  context.subscriptions.push(
    commands.registerCommand(
      `${extensionId}.showEndpointEditor`,
      () => endpointEditorPanel.showPanel()
    )
  );

  // register the sparql notebook serializer
  context.subscriptions.push(
    workspace.registerNotebookSerializer(
      extensionId,
      new SparqlNotebookSerializer()
    )
  );

  // register the notebook controller
  const sparqlNotebookController = new SparqlNotebookController();
  context.subscriptions.push(sparqlNotebookController);

  // register the cell status bar item provider
  context.subscriptions.push(notebooks.registerNotebookCellStatusBarItemProvider(extensionId, sparqlNotebookCellStatusBarItemProvider));

  // register the connections sidepanel
  window.registerTreeDataProvider(storageKey, connectionsSidepanel);

  commands.registerCommand(
    `${extensionId}.deleteConnectionConfiguration`,
    deleteConnection(context, connectionsSidepanel)
  );

  commands.registerCommand(
    `${extensionId}.addNewConnectionConfiguration`,
    addConnection(endpointEditorPanel)
  );
  commands.registerCommand(
    `${extensionId}.connect`,
    connectToEndpoint(context, connectionsSidepanel, sparqlNotebookCellStatusBarItemProvider)
  );

  const treeView = window.createTreeView('sparql-notebook-connections', {
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
  commands.registerCommand(
    `${extensionId}.createStoreFromFile`,
    createStoreFromFile(sparqlNotebookCellStatusBarItemProvider)
  );

  //  export related commands
  context.subscriptions.push(
    commands.registerCommand(
      `${extensionId}.exportToMarkdown`,
      exportToMarkdown
    )
  );

  // code cell related commands
  commands.registerCommand(
    `${extensionId}.addQueryFromFile`,
    addQueryFromFile
  );


  // load external notebook files
  // Execute code after a notebook is loaded
  // Register the onDidChangeNotebookDocument event
  context.subscriptions.push(workspace.onDidOpenNotebookDocument(notebookDocument => {
    // Check if the notebook is a SPARQL Notebook
    if (notebookDocument.notebookType !== extensionId) {
      return;
    }
    // reload the cells with external query file content
    // this have to be done here because we work with relative query file path
    // and the notebook path is not available in the deserializer
    const notebookPath = notebookDocument.uri.fsPath;
    const notebookDirectory = dirname(notebookPath);

    // cells with a file metadata
    notebookDocument.getCells().filter(cell => cell.kind === NotebookCellKind.Code && cell.metadata["file"]).forEach(async cell => {
      const activeNotebook = cell.notebook;

      if (activeNotebook) {
        const sparqlFilePath = cell.metadata['file'].replace(/\\/g, '/');

        try {
          let relativeSparqlFilePath = sparqlFilePath;
          if (isAbsolute(sparqlFilePath)) {
            relativeSparqlFilePath = relative(notebookDirectory, sparqlFilePath);
            console.log('rel path', relative(notebookPath, sparqlFilePath));
          }


          const fileContent = await workspace.fs.readFile(Uri.file(join(notebookDirectory, relativeSparqlFilePath)));
          const newCell = new NotebookCellData(NotebookCellKind.Code, `# from file ${relativeSparqlFilePath}\n${(await fileContent).toString()}`, 'sparql');

          newCell.metadata = {
            file: relativeSparqlFilePath
          };
          // Logic to add the notebook cell using the fileContent
          const notebookEdit = NotebookEdit.replaceCells(new NotebookRange(cell.index, cell.index + 1), [newCell]);
          const edit = new WorkspaceEdit();
          edit.set(notebookDocument.uri, [notebookEdit]);
          workspace.applyEdit(edit);
        } catch (error) {
          // Handle file read error
          window.showErrorMessage(`Error reading file ${sparqlFilePath}: ${error}\n$Reset the file path for the cell. ${cell.index}`);
          console.error('Error reading file:', error);
        }
      }
    });
  }));

  context.subscriptions.push(workspace.onDidSaveNotebookDocument(notebookDocument => {
    // Check if the notebook is a SPARQL Notebook
    if (notebookDocument.notebookType !== extensionId) {
      return;
    }
    // write query files here 
    const notebookPath = notebookDocument.uri.fsPath;
    const notebookDirectory = dirname(notebookPath);

    // cells with a file metadata
    notebookDocument.getCells().filter(cell => cell.kind === NotebookCellKind.Code && cell.metadata["file"]).forEach(async cell => {
      const activeNotebook = cell.notebook;
      if (activeNotebook) {
        const sparqlFilePath = cell.metadata["file"].replace(/\\/g, '/');
        try {
          let relativeSparqlFilePath = sparqlFilePath;
          if (isAbsolute(sparqlFilePath)) {
            relativeSparqlFilePath = relative(notebookDirectory, sparqlFilePath);
          }

          const sparqlQuery = cell.document.getText().replace(/^# from file.*[\r\n]/, '');
          const content = Buffer.from(sparqlQuery, 'utf-8');
          await workspace.fs.writeFile(Uri.file(join(notebookDirectory, relativeSparqlFilePath)), content);


        } catch (error) {
          window.showErrorMessage(`Error writing file: ${sparqlFilePath}: ${error}`);
          console.error('Error writing file:', error);
        }

      }
    });
  }));

};

// this method is called when your extension is deactivated
export function deactivate() { }
