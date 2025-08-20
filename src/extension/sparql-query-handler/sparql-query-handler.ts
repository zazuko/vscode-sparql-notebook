import { SimpleHttpResponse } from "../endpoint/endpoint";
import { SparqlNotebookCell } from "../notebook/sparql-notebook-cell";

export abstract class SparqlQueryHandler {
    abstract handle(queryResult: SimpleHttpResponse, sparqlCell: SparqlNotebookCell, execution: any): void;
}
