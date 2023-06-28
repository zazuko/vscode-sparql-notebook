import * as vscode from "vscode";

/**
 * Extend the vscode.NotebookCellData class to add a constructor that allows
 * a metadata object to be passed in.
 */
export class SparqlNotebookCell extends vscode.NotebookCellData {

    constructor(kind: vscode.NotebookCellKind, value: string, languageId: string, metadata: { [key: string]: any } | null = null) {
        super(kind, value, languageId);
        if (metadata) {
            this.metadata = metadata;
        }
    }
}