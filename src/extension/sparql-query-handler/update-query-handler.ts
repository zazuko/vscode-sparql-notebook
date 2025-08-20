import { SimpleHttpResponse } from "../endpoint/endpoint";
import { SparqlNotebookCell } from "../notebook/sparql-notebook-cell";
import { SparqlQueryHandler } from "./sparql-query-handler";


export class UpdateQueryHandler extends SparqlQueryHandler {

    constructor() {
        super();
    }

    /**
     * Handle the execution of an UPDATE query.
     * @param _queryResult The result of the query.
     * @param _sparqlCell The SPARQL notebook cell.
     * @param execution The notebook cell execution context.
     * @returns The output for the notebook cell.
     */
    // Note: UPDATE queries typically do not return results, so we just acknowledge the execution.
    handle(_queryResult: SimpleHttpResponse, sparqlCell: SparqlNotebookCell, execution: any) {
        execution.replaceOutput([]);
        execution.end(true, Date.now());
    }
}
