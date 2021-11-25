import * as vscode from "vscode";
import { SparqlNotebookController } from "./sparql-notebook-controller";
import { SparqlNotebookSerializer } from "./sparql-notebook-serializer";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer(
      "sparql-notebook",
      new SparqlNotebookSerializer()
    )
  );
  context.subscriptions.push(new SparqlNotebookController());
}

// this method is called when your extension is deactivated
export function deactivate() {}
