import { NotebookCell, NotebookCellOutput, NotebookCellOutputItem, NotebookController, NotebookDocument, notebooks, window, workspace } from 'vscode';
import { extensionId, globalConnection } from "./extension";
import { Endpoint, HttpEndpoint } from "./endpoint";
import { PrefixMap } from './model/prefix-map';
export class SparqlNotebookController {
  readonly controllerId = `${extensionId}-controller-id`;
  readonly notebookType = "sparql-notebook";
  readonly label = "Sparql Notebook";
  readonly supportedLanguages = ["sparql"];

  private readonly _controller: NotebookController;
  private _executionOrder = 0;

  constructor() {
    // Create a new notebook controller
    this._controller = notebooks.createNotebookController(
      this.controllerId,
      this.notebookType,
      this.label
    );

    // controller setup
    this._controller.supportedLanguages = this.supportedLanguages;
    this._controller.supportsExecutionOrder = true;

    // this is executing the cells
    this._controller.executeHandler = this._execute.bind(this);
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

  private async _doExecution(cell: NotebookCell): Promise<void> {
    const execution = this._controller.createNotebookCellExecution(cell);
    execution.executionOrder = ++this._executionOrder;

    // Keep track of elapsed time to execute cell.
    execution.start(Date.now());

    const sparqlQuery = cell.document.getText();

    // you can configure the endpoint within the query like this # [endpoint='xxxx']
    // todo: rename function
    const sparqlEndpoint = this._getDocumentOrConnectionClient(sparqlQuery);

    if (!sparqlEndpoint) {
      const errorMessage = "Not connected to a SPARQL Endpoint";
      window.showErrorMessage(errorMessage);
      execution.replaceOutput([
        this._writeError(errorMessage)
      ]);
      execution.end(true, Date.now());
      return;
    }

    // execute the query
    const queryResult = await sparqlEndpoint.query(sparqlQuery, execution).catch((error) => {
      let errorMessage = error.message ?? "error";
      if (error.hasOwnProperty("response") && error.response.hasOwnProperty("data")) {
        if (error.response.data.message) {
          errorMessage += "\n" + error.response.data.message;
        } else {
          errorMessage += "\n" + error.response.data;
        }
      }

      execution.replaceOutput([
        this._writeError(errorMessage)
      ]);
      console.error('SPARQL execution error:', errorMessage);
      execution.end(false, Date.now());
      return;
    });

    // content type
    if (!queryResult) {
      execution.replaceOutput([
        this._writeError('No result')
      ]);
      execution.end(false, Date.now());
      return;
    }
    const contentType = queryResult.headers["content-type"].split(";")[0];
    const data = queryResult.data;
    let isSuccess = true;

    if (contentType === "application/sparql-results+json") {
      if (data.hasOwnProperty("boolean")) {
        // sparql ask
        execution.replaceOutput([this._writeSparqlJsonResult(data)]);
        execution.end(isSuccess, Date.now());
        return;
      }
      // sparql select
      const prefixMap = this._extractNamespacesFromQuery(sparqlQuery);
      execution.replaceOutput([this._writeSparqlJsonResult(data, prefixMap)]);
      execution.end(isSuccess, Date.now());
      return;
    }

    if (contentType === "text/turtle") {
      // sparql construct
      execution.replaceOutput([this._writeTurtleResult(data)]);
      execution.end(isSuccess, Date.now());
      return;
    }

    if (contentType === "application/json") {
      // stardog is returning and error as json
      execution.replaceOutput([this._writeError(data.message)]);
      isSuccess = false;
      execution.end(isSuccess, Date.now());
      return;
    }
    // we should never reach this point
    const errorMessage = `Error: Unknown content type ${contentType}\n\n${data}`;
    console.error(errorMessage);
    isSuccess = false;
    execution.replaceOutput([this._writeError(errorMessage)]);
    execution.end(isSuccess, Date.now());
    return;
  }

  private _writeTurtleResult(resultTTL: string): NotebookCellOutput {
    // this is writing markdown to the cell containing a turtle code block
    return new NotebookCellOutput([
      NotebookCellOutputItem.text(resultTTL, "text/plain"),
      NotebookCellOutputItem.text(
        `\`\`\`turtle\n${resultTTL}\n\`\`\``,
        "text/markdown"
      ),
    ]);
  }

  private _writeSparqlJsonResult(resultJson: any, prefixMap: PrefixMap = {}): NotebookCellOutput {
    const outputItem = new NotebookCellOutput([
      this._writeJson(JSON.stringify(resultJson, null, "   ")),
      NotebookCellOutputItem.json(
        resultJson,
        "application/sparql-results+json"
      ),
    ]);
    outputItem.metadata = { prefixMap: prefixMap };
    return outputItem;
  }

  private _writeJson(jsonResult: any): NotebookCellOutputItem {
    return NotebookCellOutputItem.text(jsonResult, "text/x-json");
  }

  private _writeError(message: any): NotebookCellOutput {
    return new NotebookCellOutput([
      NotebookCellOutputItem.error({
        name: "SPARQL error",
        message: message,
      }),
    ]);
  }

  private _getEndpointFromQuery(sparqlQuery: string): string | undefined {
    const commentLines = sparqlQuery
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("#"));
    const endpointExp = /\[endpoint=(.*)\]/gm;
    const endpoints: string[] = [];
    commentLines.every((comment: string) => {
      const match = endpointExp.exec(comment);
      if (match) {
        endpoints.push(match[1]);
        return false;
      }
      return true;
    });
    return endpoints.shift();
  }

  private _extractNamespacesFromQuery(query: string): PrefixMap {
    const configuration = workspace.getConfiguration("sparqlbook");
    const useNamespaces = configuration.get("useNamespaces");
    if (!useNamespaces) {
      return {};
    }

    // get namespaces from prefixes in query
    let namespaces: PrefixMap = {};
    let prefixRegex = /[Pp][Rr][Ee][Ff][Ii][Xx] ([^:]*):[ ]*<([^>]*)>/g;

    // get namespaces from prefixes in query
    let match;
    while ((match = prefixRegex.exec(query)) !== null) {
      namespaces[match[1]] = match[2];
    }
    return namespaces;
  }

  dispose() { }


  /**
   * Returns an Endpoint instance for the given SPARQL query, either from the document or the global connection.
   * @param sparqlQuery - The SPARQL query to get the endpoint for.
   * @returns An Endpoint instance for the given SPARQL query, or null if no endpoint could be found.
   */
  private _getDocumentOrConnectionClient(sparqlQuery: string): Endpoint | null {
    const documentEndpoint = this._getEndpointFromQuery(sparqlQuery);
    if (documentEndpoint) {
      return new HttpEndpoint(documentEndpoint, "", "");
    }

    if (globalConnection.connection === null) {
      return null;
    }

    return new HttpEndpoint(
      globalConnection.connection.data.endpointURL,
      globalConnection.connection.data.user,
      globalConnection.connection.data.passwordKey
    );

  }
}


