import { NotebookCellExecution } from "vscode";
import { SimpleHttpResponse } from "../endpoint/endpoint";
import { SparqlNotebookCell } from "../notebook/sparql-notebook-cell";
import { SparqlQueryHandler } from "./sparql-query-handler";
import { writeTurtleResult } from "./helper/write-turtle-result";

export class ConstructQueryHandler implements SparqlQueryHandler {
    constructor() { }

    /**
     * Handle the execution of a CONSTRUCT query.
     * 
     * @param queryResult The result of the query.
     * @param _sparqlCell The SPARQL notebook cell.
     * @param execution The notebook cell execution context.
     * @returns The output for the notebook cell.
     */
    handle(queryResult: SimpleHttpResponse, _sparqlCell: SparqlNotebookCell, execution: NotebookCellExecution) {
        const cell = writeTurtleResult(queryResult.data);
        execution.replaceOutput([cell]);
        execution.end(true, Date.now());
    }

}
