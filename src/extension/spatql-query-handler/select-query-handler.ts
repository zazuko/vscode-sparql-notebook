import { SimpleHttpResponse } from "../endpoint/endpoint";
import { SparqlQueryHandler } from "./sparql-query-handler";
import { SparqlNotebookCell } from "../notebook/sparql-notebook-cell";
import { NotebookCellExecution } from "vscode";
import { writeSparqlJsonResult } from "./helper/write-sparql-json-result";


export class SelectQueryHandler extends SparqlQueryHandler {


    constructor() {
        super();
    }

    handle(queryResult: SimpleHttpResponse, _sparqlCell: SparqlNotebookCell, execution: NotebookCellExecution) {
        const prefixMap = _sparqlCell.getPrefixMap();
        const cell = writeSparqlJsonResult(queryResult.data, prefixMap);

        execution.replaceOutput([cell]);
        execution.end(true, Date.now());
    }
}
