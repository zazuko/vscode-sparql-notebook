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
  context.subscriptions.push(new SparqlNotebookController());

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
}

export function deactivate() { }

export interface EndpointConnection {
  data: EndpointConfiguration;
}
