import { NotebookCellExecution } from "vscode";
import { SimpleHttpResponse } from "../endpoint/endpoint";
import { SparqlNotebookCell } from "../notebook/sparql-notebook-cell";
import { SparqlQueryHandler } from "./sparql-query-handler";
import { writeError } from "./helper/write-error";

export class ErrorQueryHandler extends SparqlQueryHandler {

    constructor() {
        super();
    }

    handle(queryResult: SimpleHttpResponse, _sparqlCell: SparqlNotebookCell, execution: NotebookCellExecution) {
        let errorObject;
        try {
            errorObject = JSON.parse(queryResult.data);
        } catch {
            errorObject = { message: queryResult.data };
        }
        execution.replaceOutput([writeError(errorObject.message ?? 'An error occurred')]);
        execution.end(false, Date.now());
    }
}