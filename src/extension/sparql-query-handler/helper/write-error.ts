import { NotebookCellOutput, NotebookCellOutputItem } from "vscode";

export function writeError(message: string): NotebookCellOutput {
    return new NotebookCellOutput([
        NotebookCellOutputItem.error({
            name: "Error",
            message: message,
        }),
    ]);
}
