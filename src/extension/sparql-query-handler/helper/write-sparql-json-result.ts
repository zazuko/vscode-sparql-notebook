import { NotebookCellOutput, NotebookCellOutputItem } from "vscode";
import { PrefixMap } from "../../model/prefix-map";
import { writeJson } from "./write-json";
import { MimeType } from "../../const/enum/mime-type";
import { writeDataTableRendererCompatibleJson } from "./write-data-table-renderer-compatible-json";

/**
 * Writes a SPARQL query result in JSON format as a NotebookCellOutput.
 * The output includes:
 * 1. A JSON string formatted for Markdown syntax highlighting.
 * 2. A JSON object for structured data representation.
 * 3. A DataTable-compatible JSON string for rendering in data tables.
 *
 * @param resultJson - The raw SPARQL query result in JSON format.
 * @param prefixMap - Optional. A mapping of prefixes used to shorten URIs in the result.
 * @returns A NotebookCellOutput containing the formatted outputs.
 */

export function writeSparqlJsonResult(resultJson: string, prefixMap: PrefixMap = {}): NotebookCellOutput {

    const parsedResult = JSON.parse(resultJson);

    const outputItem = new NotebookCellOutput([
        writeJson(JSON.stringify(parsedResult, null, 4)),
        NotebookCellOutputItem.json(
            JSON.parse(resultJson),
            MimeType.sparqlResultsJson
        ),
        writeDataTableRendererCompatibleJson(resultJson, prefixMap)
    ]);
    outputItem.metadata = { prefixMap };
    return outputItem;
}