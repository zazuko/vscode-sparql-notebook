import * as vscode from "vscode";
import { SparqlNotebookSerializer } from "./sparql-notebook-serializer";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer(
      "sparql-notebook",
      new SparqlNotebookSerializer()
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
