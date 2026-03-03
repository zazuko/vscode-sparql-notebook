import { NotebookCell, NotebookCellExecution } from 'vscode';
import { SparqlNotebookCell } from './sparql-notebook-cell';
import { SparqlQueryHandler } from '../sparql-query-handler/sparql-query-handler';
import { SelectQueryHandler } from '../sparql-query-handler/select-query-handler';
import { AskQueryHandler } from '../sparql-query-handler/ask-query-handler';
import { UpdateQueryHandler } from '../sparql-query-handler/update-query-handler';
import { ErrorQueryHandler } from '../sparql-query-handler/error-query-handler';
import { ConstructQueryHandler } from '../sparql-query-handler/construct-query-handler';
import { ShaclQueryHandler } from '../sparql-query-handler/shacl-query-handler';
import { writeError } from '../sparql-query-handler/helper/write-error';
import { SPARQLQueryKind } from '../const/enum/sparql-query-kind';
import { HttpErrorStatus, HttpSuccessStatus } from '../endpoint/const/http-status';
import { EndpointResolver } from './endpoint-resolver';
import { NotebookErrorRenderer } from './notebook-error-renderer';

/**
 * Shared execution logic for SPARQL/SHACL notebook cells.
 * This class handles the actual execution of cells and can be used by different notebook controllers.
 */
export class NotebookCellExecutor {

    private endpointResolver: EndpointResolver;
    private errorRenderer: NotebookErrorRenderer;

    constructor() {
        this.endpointResolver = new EndpointResolver();
        this.errorRenderer = new NotebookErrorRenderer();
    }

    /**
     * Executes a single notebook cell containing SPARQL or SHACL code.
     *
     * @param nbCell - The notebook cell to execute
     * @param execution - The cell execution context
     */
    async executeCell(nbCell: NotebookCell, execution: NotebookCellExecution): Promise<void> {
        const sparqlCell = new SparqlNotebookCell(nbCell);
        const languageId = nbCell.document.languageId;

        const sparqlQuery = sparqlCell.sparqlQuery;
        const notebookUri = nbCell.notebook.uri;
        const sparqlEndpoint = await this.endpointResolver.getDocumentOrConnectionClient(sparqlQuery, notebookUri);

        if (sparqlEndpoint === null) {
            this.errorRenderer.showConnectionErrorMessage(sparqlQuery, execution);
            execution.end(false, Date.now());
            return;
        }

        let queryResult;

        if (languageId === "shacl") {
            // SHACL validation - use the raw text and call validate()
            const shaclText = nbCell.document.getText();
            queryResult = await sparqlEndpoint.validate(shaclText, execution).catch(
                (error) => {
                    this.errorRenderer.showNetworkErrorMessage(error, execution);
                    execution.end(false, Date.now());
                    return undefined;
                });
        } else {
            // SPARQL query - use the SparqlQuery object
            queryResult = await sparqlEndpoint.query(sparqlQuery, execution).catch(
                (error) => {
                    this.errorRenderer.showNetworkErrorMessage(error, execution);
                    execution.end(false, Date.now());
                    return undefined;
                });
        }

        if (!queryResult) {
            execution.replaceOutput([
                writeError('No result')
            ]);
            execution.end(false, Date.now());
            return;
        }

        if (queryResult.status === HttpErrorStatus.BadRequest) {
            this.errorRenderer.showHttpErrorMessage(queryResult, 'Bad Request', sparqlEndpoint, execution);
            execution.end(false, Date.now());
            return;
        }

        if (queryResult.status !== HttpSuccessStatus.OK && queryResult.status !== HttpSuccessStatus.NoContent) {
            this.errorRenderer.showHttpErrorMessage(queryResult, queryResult.statusText || 'Error', sparqlEndpoint, execution);
            writeError(`SPARQL query failed: ${queryResult.status ?? ''} ${queryResult.statusText ?? ''} ${queryResult.data ?? ''}`);
            execution.end(false, Date.now());
            return;
        }

        // Get the appropriate handler based on language or query type
        const handler = languageId === "shacl"
            ? new ShaclQueryHandler()
            : this.#getHandlerForType(sparqlQuery.kind);
        handler.handle(queryResult, sparqlCell, execution);
    }

    #getHandlerForType(type: string): SparqlQueryHandler {
        switch (type) {
            case SPARQLQueryKind.select: return new SelectQueryHandler();
            case SPARQLQueryKind.ask: return new AskQueryHandler();
            case SPARQLQueryKind.construct: return new ConstructQueryHandler();
            case SPARQLQueryKind.describe: return new ConstructQueryHandler();
            case SPARQLQueryKind.insert: return new UpdateQueryHandler();
            case SPARQLQueryKind.create: return new UpdateQueryHandler();
            case SPARQLQueryKind.drop: return new UpdateQueryHandler();
            case SPARQLQueryKind.clear: return new UpdateQueryHandler();
            case SPARQLQueryKind.delete: return new UpdateQueryHandler();
            case SPARQLQueryKind.load: return new UpdateQueryHandler();
            default: return new ErrorQueryHandler();
        }
    }
}
