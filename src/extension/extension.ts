import * as vscode from "vscode";

import { SparqlNotebookController } from "./sparql-notebook-controller";
import { EndpointConnections } from "./sparql-connection-menu";

import { SparqlNotebookSerializer } from "./file-io";

import { deleteConnection } from "./commands/sparql-connection/delete-connection";
import { addConnection } from "./commands/sparql-connection/add-connection";
import { connectToDatabase } from "./commands/sparql-connection/connect-to-database";

import { exportToMarkdown } from "./commands/export/export-to-markdown";
import { addQueryFromFile } from "./commands/code-cell/add-query-from-file";

import { EndpointConnection } from "./model/endpoint-connection";
import { activateFormProvider } from "./new-connection-view/new-connection-view";
export const storageKey = "sparql-notebook-connections";

// holds the current connection
export const globalConnection: { connection: EndpointConnection | null } = {
  connection: null,
};

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer(
      "sparql-notebook",
      new SparqlNotebookSerializer()
    )
  );

  // register the notebook controller
  const sparqlNotebookController = new SparqlNotebookController();
  context.subscriptions.push(sparqlNotebookController);

  // register the connections sidepanel
  const connectionsSidepanel = new EndpointConnections(context);
  vscode.window.registerTreeDataProvider(storageKey, connectionsSidepanel);

  activateFormProvider(context);
  // register the commands
  //   connection related commands
  vscode.commands.registerCommand(
    "sparql-notebook.deleteConnectionConfiguration",
    deleteConnection(context, connectionsSidepanel)
  );

  vscode.commands.registerCommand(
    "sparql-notebook.addNewConnectionConfiguration",
    addConnection(context, connectionsSidepanel)
  );
  vscode.commands.registerCommand(
    "sparql-notebook.connect",
    connectToDatabase(context, connectionsSidepanel)
  );

  //  export related commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "sparql-notebook.exportToMarkdown",
      exportToMarkdown
    )
  );

  // code cell related commands
  vscode.commands.registerCommand(
    "sparql-notebook.addQueryFromFile",
    addQueryFromFile
  );
}

// this method is called when your extension is deactivated
export function deactivate() { }

