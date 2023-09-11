import * as vscode from "vscode";

import { SparqlNotebookController } from "./sparql-notebook-controller";
import { EndpointConnections } from "./sparql-connection-menu";

import { SparqlNotebookSerializer } from "./file-io";

import { deleteConnection } from "./commands/sparql-connection/delete-connection";
import { addConnection } from "./commands/sparql-connection/add-connection";
import { connectToDatabase } from "./commands/sparql-connection/connect-to-database";

import { exportToMarkdown } from "./commands/export/export-to-markdown";
import { addQueryFromFile } from "./commands/code-cell/add-query-from-file";

import { activateFormProvider } from "./connection-view/connection-view";
import { createStoreFromFile } from "./commands/store-from-file/store-from-file";

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
    connectToDatabase(context, connectionsSidepanel)
  );

  vscode.commands.registerCommand(
    `${extensionId}.createStoreFromFile`,
    createStoreFromFile
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
}

// this method is called when your extension is deactivated
export function deactivate() { }

