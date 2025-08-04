import { NotebookCellOutput, NotebookCellOutputItem } from "vscode";
import { writeJson } from "./write-json";
import { MimeType } from "../../../const/enum/mime-type";

export function writeAskResult(resultJson: string): NotebookCellOutput {
    const outputItem = new NotebookCellOutput([
        writeJson(resultJson),
        NotebookCellOutputItem.json(
            JSON.parse(resultJson),
            MimeType.sparqlResultsJson
        ),
    ]);
    return outputItem;
}