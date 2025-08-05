import { NotebookCell, NotebookCellOutput, RelativePattern, NotebookCellOutputItem, NotebookController, NotebookDocument, Uri, commands, notebooks, window, workspace } from 'vscode';
import { extensionId } from "../extension";
import { Endpoint, FileEndpoint, HttpEndpoint, } from "../endpoint";
import { PrefixMap } from '../model/prefix-map';
import { notebookEndpoint } from '../endpoint/endpoint';
import { SparqlNotebookCell } from './sparql-notebook-cell';
import { shrink } from '@zazuko/prefixes';
import { EndpointKind, SparqlQuery } from '../endpoint/model/sparql-query';
import { MimeType } from '../const/enum/mime-type';
import path = require('path');
import { SparqlQueryHandler } from '../spatql-query-handler/sparql-query-handler';
import { SelectQueryHandler } from '../spatql-query-handler/select-query-handler';
import { AskQueryHandler } from '../spatql-query-handler/ask-query-handler';
import { UpdateQueryHandler } from '../spatql-query-handler/update-query-handler';
import { ErrorQueryHandler } from '../spatql-query-handler/error-query-handler';
import { ConstructQueryHandler } from '../spatql-query-handler/construct-query-handler';
import { writeError } from '../spatql-query-handler/helper/write-error';
import { SPARQLQueryKind } from '../const/enum/sparql-query-kind';

export class SparqlNotebookController {
  readonly controllerId = `${extensionId}-controller-id`;
  readonly notebookType = extensionId;
  readonly label = "Sparql Notebook";
  readonly supportedLanguages = ["sparql"];

  readonly #controller: NotebookController;
  #executionOrder = 0;

  constructor() {
    // Create a new notebook controller
    this.#controller = notebooks.createNotebookController(
      this.controllerId,
      this.notebookType,
      this.label
    );

    // controller setup
    this.#controller.supportedLanguages = this.supportedLanguages;
    this.#controller.supportsExecutionOrder = true;

    // this is executing the cells
    this.#controller.executeHandler = this._execute.bind(this);
  }



  /**
   * Executes the given cells by calling the _doExecution method for each cell.
   * @param cells - The cells to execute.
   * @param _notebook - The notebook document containing the cells.
   * @param _controller - The notebook controller for the notebook document.
   */
  private _execute(cells: NotebookCell[], _notebook: NotebookDocument, _controller: NotebookController): void {
    for (let cell of cells) {
      this._doExecution(cell);
    }
  }


  private _getHandlerForType(type: string): SparqlQueryHandler {
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

  private async _doExecution(nbCell: NotebookCell): Promise<void> {
    const sparqlCell = new SparqlNotebookCell(nbCell);
    const execution = this.#controller.createNotebookCellExecution(sparqlCell.cell);
    execution.executionOrder = ++this.#executionOrder;
    execution.start(Date.now());

    const sparqlQuery = sparqlCell.sparqlQuery;
    const sparqlEndpoint = await this._getDocumentOrConnectionClient(sparqlCell, sparqlQuery);

    if (!sparqlEndpoint) {
      const errorMessage = "Not connected to a SPARQL Endpoint";
      const actionButton = "Connect to SPARQL Endpoint";
      window.showErrorMessage(errorMessage, actionButton).then((action) => {
        if (action === actionButton) {
          commands.executeCommand('sparql-notebook.connect');
        }
      });
      execution.replaceOutput([
        writeError(errorMessage)
      ]);
      execution.end(true, Date.now());
      return;
    }

    console.log('Executing SPARQL query:', sparqlQuery.kind);
    const queryResult = await sparqlEndpoint.query(sparqlQuery, execution).catch(
      (error) => {
        let errorMessage = error.message ?? "error";
        if (error.hasOwnProperty("response") && error.response.hasOwnProperty("data")) {
          if (error.response.data.message) {
            errorMessage += "\n" + error.response.data.message;
          } else {
            errorMessage += "\n" + error.response.data + "\nstatus: " + error.response.status + " " + error.response.statusText;
          }
        }
        execution.replaceOutput([
          writeError(errorMessage)
        ]);
        console.error('SPARQL execution error:', errorMessage);
        execution.end(false, Date.now());
        return;
      });

    if (!queryResult) {
      execution.replaceOutput([
        writeError('No result')
      ]);
      execution.end(false, Date.now());
      return;
    }

    const handler = this._getHandlerForType(sparqlQuery.kind);
    handler.handle(queryResult, sparqlCell, execution);
  }


  dispose() {
    this.#controller.dispose();
  }


  /**
   * Returns an Endpoint instance for the given SPARQL query, either from the document or the global connection.
   * @param sparqlQuery - The SPARQL query to get the endpoint for.
   * @returns An Endpoint instance for the given SPARQL query, or null if no endpoint could be found.
   */
  private async _getDocumentOrConnectionClient(cell: SparqlNotebookCell, sparqlQuery: SparqlQuery): Promise<Endpoint | null> {
    const documentEndpoints = sparqlQuery.extractEndpoint().getEndpoints();
    const queryOptions = sparqlQuery.extractQueryOptions();


    if (documentEndpoints.length > 0) {

      if (documentEndpoints[0].kind === EndpointKind.Http) {
        // http endpoint (only one is supported)
        return new HttpEndpoint(documentEndpoints[0].endpoint, "", "");
      }
      if (documentEndpoints[0].kind === EndpointKind.File) {
        // file endpoint
        const fileEndpoint = new FileEndpoint();
        for (const extractFileEndpoint of documentEndpoints) {
          await this.#loadFileToStore(extractFileEndpoint.endpoint, fileEndpoint);
        }
        if (queryOptions.size > 0) {
          const hasUseDefaultGraphAsUnion = queryOptions.get('use_default_graph_as_union');
          if (hasUseDefaultGraphAsUnion && hasUseDefaultGraphAsUnion === 'true') {
            fileEndpoint.useDefaultGraphAsUnion();

          }

        }
        return fileEndpoint;
      }
    }
    return notebookEndpoint.endpoint;

  }

  async #loadFileToStore(filePathPattern: string, fileEndpoint: FileEndpoint): Promise<void> {
    const notebookUri = window.activeNotebookEditor?.notebook.uri;
    const fileUri: Uri[] = [];

    if (filePathPattern.startsWith('/')) {
      // Absolute pattern
      const fileName = path.basename(filePathPattern);
      const directory = path.dirname(filePathPattern);
      const relativePattern = new RelativePattern(directory, fileName);
      const files = await workspace.findFiles(relativePattern);

      fileUri.push(...files);
    } else {
      // Relative pattern

      const notebookDirectory = path.dirname(notebookUri!.fsPath);
      const normalizedPattern = path.normalize(path.join(notebookDirectory, filePathPattern));

      const fileName = path.basename(normalizedPattern);
      const directory = path.dirname(normalizedPattern);

      const relativePattern = new RelativePattern(directory, fileName);
      const files = await workspace.findFiles(relativePattern);

      fileUri.push(...files);
      if (files.length === 0) {
        window.showErrorMessage(`No files found for pattern ${filePathPattern}`);
      }
    }

    for (const uri of fileUri) {
      await fileEndpoint.addFile(uri);
    };


  }

}
