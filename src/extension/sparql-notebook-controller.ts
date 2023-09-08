import * as vscode from "vscode";
import { globalConnection } from "./extension";
import { SparqlClient } from "./sparql-client";
import { PrefixMap } from './model/prefix-map';
export class SparqlNotebookController {
  readonly controllerId = "sparql-notebook-controller-id";
  readonly notebookType = "sparql-notebook";
  readonly label = "Sparql Notebook";
  readonly supportedLanguages = ["sparql"];

  private readonly _controller: vscode.NotebookController;
  private _executionOrder = 0;

  constructor() {
    this._controller = vscode.notebooks.createNotebookController(
      this.controllerId,
      this.notebookType,
      this.label
    );

    this._controller.supportedLanguages = this.supportedLanguages;
    this._controller.supportsExecutionOrder = true;
    this._controller.executeHandler = this._execute.bind(this);
  }

  private _execute(
    cells: vscode.NotebookCell[],
    _notebook: vscode.NotebookDocument,
    _controller: vscode.NotebookController
  ): void {

    for (let cell of cells) {
      this._doExecution(cell);
    }
  }

  private async _doExecution(cell: vscode.NotebookCell): Promise<void> {
    const execution = this._controller.createNotebookCellExecution(cell);
    execution.executionOrder = ++this._executionOrder;

    // Keep track of elapsed time to execute cell.
    execution.start(Date.now());

    const sparqlQueryText = cell.document.getText();

    // you can configure the endpoint within the query like this # [endpoint='xxxx']
    const client = this._getDocumentOrConnectionClient(sparqlQueryText);

    if (!client) {
      const errorMessage = "Not connected to a SPARQL Endpoint";
      vscode.window.showErrorMessage(errorMessage);
      execution.replaceOutput([
        this._writeError(errorMessage)
      ]);
      execution.end(true, Date.now());
      return;
    }

    // execute the query
    const queryResult = await client.query(sparqlQueryText, execution).catch((error) => {
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
      const prefixMap = this._extractNamespacesFromQuery(sparqlQueryText);
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

  private _writeTurtleResult(resultTTL: string): vscode.NotebookCellOutput {
    return new vscode.NotebookCellOutput([
      vscode.NotebookCellOutputItem.text(resultTTL, "text/plain"),
      vscode.NotebookCellOutputItem.text(
        `\`\`\`turtle\n${resultTTL}\n\`\`\``,
        "text/markdown"
      ),
    ]);
  }

  private _writeSparqlJsonResult(resultJson: any, prefixMap: PrefixMap = {}): vscode.NotebookCellOutput {
    const outputItem = new vscode.NotebookCellOutput([
      this._writeJson(JSON.stringify(resultJson, null, "   ")),
      vscode.NotebookCellOutputItem.json(
        resultJson,
        "application/sparql-results+json"
      ),
    ]);
    outputItem.metadata = { prefixMap: prefixMap };
    return outputItem;
  }

  private _writeJson(jsonResult: any): vscode.NotebookCellOutputItem {
    return vscode.NotebookCellOutputItem.text(jsonResult, "text/x-json");
  }

  private _writeError(message: any): vscode.NotebookCellOutput {
    return new vscode.NotebookCellOutput([
      vscode.NotebookCellOutputItem.error({
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
    const configuration = vscode.workspace.getConfiguration("sparqlbook");
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
   * You can configure the endpoint within the query like this # [endpoint='url'] 
   * or use the sparql notebook connection settings. This function will return the
   * a SPARQL Client according your configuration. The endpoint in the SPARQL query 
   * has precedence. 
    
   * @param sparqlQuery 
   * @returns a SPARQL Client according to your configuration. 
   */
  private _getDocumentOrConnectionClient(sparqlQuery: string): SparqlClient | null {
    const documentEndpoint = this._getEndpointFromQuery(sparqlQuery);
    if (documentEndpoint) {
      return new SparqlClient(documentEndpoint, "", "");
    }

    if (globalConnection.connection === null) {
      return null;
    }

    return new SparqlClient(
      globalConnection.connection.data.endpointURL,
      globalConnection.connection.data.user,
      globalConnection.connection.data.passwordKey
    );

  }
}


