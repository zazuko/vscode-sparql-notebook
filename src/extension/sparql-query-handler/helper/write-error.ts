import { NotebookCellOutput, NotebookCellOutputItem } from "vscode";

export function writeError(message: string): NotebookCellOutput {
    return new NotebookCellOutput([
        NotebookCellOutputItem.error({
            name: "SPARQL error",
            message: message,
        }),
    ]);
}
