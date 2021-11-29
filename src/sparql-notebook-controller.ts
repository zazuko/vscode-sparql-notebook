import * as vscode from "vscode";
import { SparqlClient } from "./simple-client";

export class SparqlNotebookController {
  readonly controllerId = "sparql-notebook-controller-id";
  readonly notebookType = "sparql-notebook";
  readonly label = "Sparql Notebook";
  readonly supportedLanguages = ["sparql", "rdfmapping"];

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
    execution.start(Date.now()); // Keep track of elapsed time to execute cell.

    const queryResult = await SparqlClient.query(cell.document.getText()).catch(
      (error) => {
        execution.replaceOutput([
          new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.error(error),
          ]),
        ]);
        execution.end(true, Date.now());
        return;
      }
    );

    // content type
    const contentType = queryResult.headers["content-type"];
    const data = queryResult.data;

    if (contentType === "application/sparql-results+json") {
      // sparql ask or select
      execution.replaceOutput([this._writeSparqlJsonResult(data)]);
    } else if (contentType === "text/turtle") {
      // sparql construct
      execution.replaceOutput([this._writeTurtleResult(data)]);
    } else if (contentType === "application/json") {
      // stardog is returning and error as json
      execution.replaceOutput([this._writeError(data)]);
    }
    execution.end(true, Date.now());
  }

  private _writeTurtleResult(resultTTL: string): vscode.NotebookCellOutput {
    return new vscode.NotebookCellOutput([
      vscode.NotebookCellOutputItem.text(resultTTL, "text/x-turtle"),
      vscode.NotebookCellOutputItem.text(resultTTL),
    ]);
  }

  private _writeSparqlJsonResult(resultJson: any): vscode.NotebookCellOutput {
    if (resultJson.hasOwnProperty("boolean")) {
      // ASK Query result
      return new vscode.NotebookCellOutput([this._writeJson(resultJson)]);
    }
    return new vscode.NotebookCellOutput([
      this._writeHtml(resultJson),
      this._writeJson(resultJson),
    ]);
  }

  private _writeHtml(resultJson: any): vscode.NotebookCellOutputItem {
    let resultHtml = `<table>
    <tr>`;
    resultJson.head.vars.forEach((heading: string) => {
      resultHtml += `\n        <th>${heading}</th>\n`;
    });
    resultJson.results.bindings.forEach((result: any) => {
      resultHtml += "    <tr>";
      resultJson.head.vars.forEach((heading: string) => {
        resultHtml += `\n        <td>${result[heading].value}</td>\n`;
      });
      resultHtml += "    </tr>\n";
    });
    resultHtml += "</table>";

    return vscode.NotebookCellOutputItem.text(resultHtml, "text/html");
  }

  private _writeJson(jsonResult: any): vscode.NotebookCellOutputItem {
    return vscode.NotebookCellOutputItem.json(jsonResult);
  }

  private _writeError(error: any): vscode.NotebookCellOutput {
    return new vscode.NotebookCellOutput([
      vscode.NotebookCellOutputItem.error({
        name: "SPARQL error",
        message: error.message,
      }),
    ]);
  }

  dispose() {}
}
