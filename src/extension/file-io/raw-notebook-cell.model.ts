import * as vscode from "vscode";

export interface RawNotebookCell {
  language: string;
  value: string;
  kind: vscode.NotebookCellKind;
}
