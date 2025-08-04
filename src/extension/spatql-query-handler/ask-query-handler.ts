import { NotebookCellExecution } from "vscode";
import { SimpleHttpResponse } from "../endpoint/endpoint";
import { SparqlNotebookCell } from "../notebook/sparql-notebook-cell";
import { SparqlQueryHandler } from "./sparql-query-handler";
import { writeAskResult } from "./helper/write-ask-result";

export class AskQueryHandler extends SparqlQueryHandler {
    constructor() {
        super();
    }

    /**
     * Handle the execution of an ASK query.
     * 
     * @param queryResult The result of the query.
     * @param _sparqlCell The SPARQL notebook cell.
     * @param execution The notebook cell execution context.
     * @returns The output for the notebook cell.
     */
    handle(queryResult: SimpleHttpResponse, _sparqlCell: SparqlNotebookCell, execution: NotebookCellExecution) {
        const cell = writeAskResult(queryResult.data);
        execution.replaceOutput([cell]);
        execution.end(true, Date.now());
    }

}