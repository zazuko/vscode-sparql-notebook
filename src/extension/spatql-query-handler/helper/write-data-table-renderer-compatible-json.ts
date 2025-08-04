import { shrink } from "@zazuko/prefixes";
import { PrefixMap } from "../../model/prefix-map";
import { NotebookCellOutputItem } from "vscode";
import { MimeType } from "../../../const/enum/mime-type";

/**
 * Transforms a SPARQL query result JSON string into a simplified JSON array of objects,
 * where each object represents a result row with variable names as keys and their values.
 * The output is formatted for compatibility with the Data Table Renderers Extension by Random Fractals Inc.
 *
 * @param resultJsonString - The raw SPARQL query result in JSON format.
 * @param prefixMap - Optional. A mapping of prefixes used to shorten URIs in the result.
 * @returns A NotebookCellOutputItem containing the DataTable-compatible JSON string.
 */
export function writeDataTableRendererCompatibleJson(resultJsonString: string, prefixMap: PrefixMap = {}) {
    const resultJson = JSON.parse(resultJsonString);
    const dtJonBindings: { [k: string]: any }[] = resultJson.results.bindings;

    const dtJson = dtJonBindings.map(item => {
        const dtMap = Object.keys(item).reduce((prev, key) => {
            const fieldTypeValue = item[key];
            let fieldValue = fieldTypeValue.value;

            if (fieldTypeValue.type === "uri") {
                const prefixedValue = shrink(fieldValue, prefixMap);
                fieldValue = prefixedValue.length > 0 ? prefixedValue : fieldValue;
            }

            prev.set(key, fieldValue);
            return prev;
        }, new Map());

        return Object.fromEntries(dtMap.entries());
    });

    const jsonStringified = JSON.stringify(dtJson, null, "   ");
    return NotebookCellOutputItem.text(jsonStringified, MimeType.json);
}