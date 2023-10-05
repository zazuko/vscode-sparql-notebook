import { NotebookCell, NotebookCellOutput, NotebookCellOutputItem, NotebookController, NotebookDocument, Uri, notebooks, window, workspace } from 'vscode';
import { extensionId } from "../extension";
import { Endpoint, FileEndpoint, HttpEndpoint, } from "../endpoint";
import { PrefixMap } from '../model/prefix-map';
import { notebookEndpoint } from '../endpoint/endpoint';
import { SparqlNotebookCellStatusBarItemProvider } from './SparqlNotebookCellStatusBarItemProvider';
import { SparqlNotebookCell } from './sparql-notebook-cell';

/****** */
import getStream from 'get-stream';
import formats from '@rdfjs-elements/formats-pretty';
import { Readable } from 'stream';

import prefixes from '@zazuko/prefixes';


export class SparqlNotebookController {
  readonly controllerId = `${extensionId}-controller-id`;
  readonly notebookType = extensionId;
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

  private async _doExecution(nbCell: NotebookCell): Promise<void> {
    const cell = new SparqlNotebookCell(nbCell);
    const execution = this._controller.createNotebookCellExecution(cell.asNotebookCell);
    execution.executionOrder = ++this._executionOrder;

    // Keep track of elapsed time to execute cell.
    execution.start(Date.now());

    const sparqlQuery = cell.document.getText();

    // you can configure the endpoint within the query like this # [endpoint='xxxx']
    // todo: rename function
    const sparqlEndpoint = await this._getDocumentOrConnectionClient(cell);

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
      const prefixMap = cell.getPrefixMap();
      execution.replaceOutput([this._writeSparqlJsonResult(data, prefixMap)]);
      execution.end(isSuccess, Date.now());
      return;
    }

    if (contentType === "text/turtle") {
      // sparql construct
      execution.replaceOutput([await this._writeTurtleResult(data, cell.getPrefixMap())]);
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

    // Create a new readable stream
    const ttlStream = new Readable({
      read() {
        // Push the string to the stream
        this.push(resultTTL);
        // Signal the end of the stream
        this.push(null);
      },
    });

    const ttlStream2 = new Readable({
      read() {
        // Push the string to the stream
        this.push(resultTTL);
        // Signal the end of the stream
        this.push(null);
      },
    });

    const quads = formats.parsers.import('text/turtle', ttlStream);
    const prettyTurtle = await getStream(formats.serializers.import('text/turtle', quads!, { prefixes: prefix }));

    // this is writing markdown to the cell containing a turtle code block
    return new NotebookCellOutput([

      NotebookCellOutputItem.text(prettyTurtle, "text/plain"),
      NotebookCellOutputItem.text(
        `\`\`\`turtle\n${prettyTurtle}\n\`\`\``,
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

  dispose() {
    this._controller.dispose();
  }


  /**
   * Returns an Endpoint instance for the given SPARQL query, either from the document or the global connection.
   * @param sparqlQuery - The SPARQL query to get the endpoint for.
   * @returns An Endpoint instance for the given SPARQL query, or null if no endpoint could be found.
   */
  private async _getDocumentOrConnectionClient(cell: SparqlNotebookCell): Promise<Endpoint | null> {
    const documentEndpoint = cell.extractDocumentEndpoint();
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
    return notebookEndpoint.getEndpoint();
  }


}
