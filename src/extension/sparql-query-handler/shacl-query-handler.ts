import { NotebookCellExecution } from "vscode";
import { SimpleHttpResponse } from "../endpoint/endpoint";
import { SparqlNotebookCell } from "../notebook/sparql-notebook-cell";
import { SparqlQueryHandler } from "./sparql-query-handler";
import { writeTurtleResult } from "./helper/write-turtle-result";

/**
 * Handler for SHACL validation results.
 * SHACL validation returns turtle format containing the validation report.
 */
export class ShaclQueryHandler implements SparqlQueryHandler {
    constructor() { }

    /**
     * Handle the result of a SHACL validation.
     *
     * @param queryResult The result of the SHACL validation (turtle format).
     * @param _sparqlCell The SHACL notebook cell.
     * @param execution The notebook cell execution context.
     */
    handle(queryResult: SimpleHttpResponse, _sparqlCell: SparqlNotebookCell, execution: NotebookCellExecution) {
        const cell = writeTurtleResult(queryResult.data);
        execution.replaceOutput([cell]);
        execution.end(true, Date.now());
    }
}
