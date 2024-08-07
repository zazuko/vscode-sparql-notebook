import { NotebookCell, NotebookCellOutput, NotebookCellOutputItem, NotebookController, NotebookDocument, Uri, commands, notebooks, window, workspace } from 'vscode';
import { extensionId } from "../extension";
import { Endpoint, FileEndpoint, HttpEndpoint, } from "../endpoint";
import { PrefixMap } from '../model/prefix-map';
import { notebookEndpoint } from '../endpoint/endpoint';
import { SparqlNotebookCell } from './sparql-notebook-cell';
import { shrink } from '@zazuko/prefixes';
import { SparqlQuery } from '../endpoint/model/sparql-query';

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

  private async _doExecution(nbCell: NotebookCell): Promise<void> {
    const sparqlCell = new SparqlNotebookCell(nbCell);
    const execution = this.#controller.createNotebookCellExecution(sparqlCell.cell);
    execution.executionOrder = ++this.#executionOrder;

    // Keep track of elapsed time to execute cell.
    execution.start(Date.now());

    const sparqlQuery = sparqlCell.sparqlQuery;
    // you can configure the endpoint within the query like this # [endpoint='xxxx']
    const sparqlEndpoint = await this._getDocumentOrConnectionClient(sparqlCell, sparqlQuery);

    if (!sparqlEndpoint) {
      const errorMessage = "Not connected to a SPARQL Endpoint";
      const actionButton = "Connect to SPARQL Endpoint";

      window.showErrorMessage(errorMessage, actionButton).then((action) => {
        if (action === actionButton) {
          commands.executeCommand('sparql-notebook.connect');

        }
      }
      );
      execution.replaceOutput([
        this._writeError(errorMessage)
      ]);
      execution.end(true, Date.now());
      return;
    }

    // execute the query
    const queryResult = await sparqlEndpoint.query(sparqlQuery, execution).catch(
      (error) => {
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
        execution.replaceOutput([this._writeAskResult(data)]);
        execution.end(isSuccess, Date.now());
        return;
      }
      // sparql select
      const prefixMap = sparqlCell.getPrefixMap();
      execution.replaceOutput([this._writeSparqlJsonResult(data, prefixMap)]);
      execution.end(isSuccess, Date.now());
      return;
    }

    if (contentType === "text/turtle") {
      // sparql construct
      execution.replaceOutput([await this._writeTurtleResult(data, sparqlCell.getPrefixMap())]);
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

  private async _writeTurtleResult(resultTTL: string, prefix: PrefixMap): Promise<NotebookCellOutput> {

    // this is writing markdown to the cell containing a turtle code block
    return new NotebookCellOutput([

      NotebookCellOutputItem.text(resultTTL, "text/plain"),
      NotebookCellOutputItem.text(
        `\`\`\`turtle\n${resultTTL}\n\`\`\``,
        "text/markdown"
      ),
    ]);
  }

  private _writeAskResult(resultJson: any): NotebookCellOutput {
    const outputItem = new NotebookCellOutput([
      this._writeJson(JSON.stringify(resultJson, null, "   ")),
      NotebookCellOutputItem.json(
        resultJson,
        "application/sparql-results+json"
      ),
    ]);
    return outputItem;
  }

  private _writeSparqlJsonResult(resultJson: any, prefixMap: PrefixMap = {}): NotebookCellOutput {
    const outputItem = new NotebookCellOutput([
      this._writeJson(JSON.stringify(resultJson, null, "   ")),
      NotebookCellOutputItem.json(
        resultJson,
        "application/sparql-results+json"
      ),
      this._writeDataTableRendererCompatibleJson(resultJson, prefixMap)
    ]);
    outputItem.metadata = { prefixMap: prefixMap };
    return outputItem;
  }

  private _writeJson(jsonResult: any): NotebookCellOutputItem {
    return NotebookCellOutputItem.text(
      `\`\`\`json\n${jsonResult}\n\`\`\``,
      "text/markdown"
    );
  }

  private _writeError(message: any): NotebookCellOutput {
    return new NotebookCellOutput([
      NotebookCellOutputItem.error({
        name: "SPARQL error",
        message: message,
      }),
    ]);
  }

  private _writeDataTableRendererCompatibleJson(resultJson: any, prefixMap: PrefixMap = {}) {
    const dtJonBindings: { [k: string]: any }[] = resultJson.results.bindings;

    const dtJson = dtJonBindings.map(item => {
      const dtMap = Object.keys(item).reduce((prev, key) => {
        const fieldTypeValue = item[key];
        let fieldValue = fieldTypeValue.value;

        if (fieldTypeValue.type === "uri") {
          const prefixedValue = shrink(fieldValue, prefixMap);
          fieldValue = prefixedValue.length > 0 ? prefixedValue : fieldValue;
        }

        prev.set(key, fieldValue);
        return prev;
      }, new Map());

      return Object.fromEntries(dtMap.entries());
    });

    const jsonStringified = JSON.stringify(dtJson, null, "   ");
    return NotebookCellOutputItem.text(jsonStringified, "application/json");
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
    const documentEndpoint = sparqlQuery.extractEndpoint();
    if (documentEndpoint) {
      if (documentEndpoint.startsWith("http")) {
        return new HttpEndpoint(documentEndpoint, "", "");
      }
      const filePath = documentEndpoint;
      let fileUri: Uri;
      if (filePath.startsWith('/')) {
        // Absolute path
        fileUri = Uri.file(filePath);
      } else {
        // Relative path
        const activeFileDir = Uri.parse(cell.document.uri.toString(true)).with({ path: cell.document.uri.path.replace(/\/[^\/]*$/, '') });
        fileUri = activeFileDir.with({ path: `${activeFileDir.path}/${filePath}` });
      }
      console.log('fileUri', fileUri.fsPath);
      const fileEndpoint = new FileEndpoint();
      await fileEndpoint.addFile(fileUri);
      return fileEndpoint;
    }
    return notebookEndpoint.endpoint;
  }


}
