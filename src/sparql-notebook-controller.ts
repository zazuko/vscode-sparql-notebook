import * as vscode from "vscode";
import { globalConnection } from "./extension";
import { SparqlClient } from "./simple-client";

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
    execution.start(Date.now()); // Keep track of elapsed time to execute cell.

    let client: SparqlClient | null = null;
    const sparqlQuery = cell.document.getText();
    const documentEndpoint = this._getEndpointFromQuery(sparqlQuery);
    if (documentEndpoint) {
      client = new SparqlClient(documentEndpoint, "", "");
    } else {
      if (globalConnection.connection === null) {
        vscode.window.showErrorMessage("Not connected to a SPARQL Endpoint");
        execution.end(true, Date.now());
        return;
      }
      client = new SparqlClient(
        globalConnection.connection.data.endpointURL,
        globalConnection.connection.data.user,
        globalConnection.connection.data.passwordKey
      );
    }

    const queryResult = await client
      .query(cell.document.getText())
      .catch((error) => {
        execution.replaceOutput([
          new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.error(error),
          ]),
        ]);
        execution.end(true, Date.now());
        return;
      });

    // content type
    const contentType = queryResult.headers["content-type"].split(";")[0];
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
    } else {
      console.log("unknown content type", contentType);
      console.log("data", data);
    }
    execution.end(true, Date.now());
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

  private _writeSparqlJsonResult(resultJson: any): vscode.NotebookCellOutput {
    if (resultJson.hasOwnProperty("boolean")) {
      // ASK Query result
      return new vscode.NotebookCellOutput([this._writeHtml(resultJson)]);
    }
    return new vscode.NotebookCellOutput([
      this._writeHtml(resultJson),
      this._writeJson(JSON.stringify(resultJson, null, "   ")),
    ]);
  }

  private _writeHtml(resultJson: any): vscode.NotebookCellOutputItem {
    let resultHtml = `
    <style>
  
*, *:before, *:after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

table {
  background-color: rgb(46, 53, 62);
  border-radius: 0.25em;
  border-collapse: collapse;
  margin: 1em;
}
th {
  border-bottom: 1px solid #364043;
  color: #28b1de;
  font-size: 0.85em;
  font-weight: 600;
  padding: 0.5em 1em;
  text-align: left;
}
td {
  color: lightgrey;
  font-weight: 400;
  padding: 0.65em 1em;
  text-align: left;
}
tr > td:last-of-type {
  text-align: right;
}
tbody tr {
  transition: background 0.25s ease;
}
tbody tr:hover {
  background: #014055;
}


    </style>
    <table>
    <tr>`;
    resultJson.head.vars.forEach((heading: string) => {
      resultHtml += `\n        <th>${heading}</th>\n`;
    });
    resultJson.results.bindings.forEach((result: any) => {
      resultHtml += "    <tr>";

      resultJson.head.vars.forEach((heading: string) => {
        resultHtml += `\n        <td>${
          result[heading]?.value
            ?.replaceAll("<", "&lt;")
            ?.replaceAll(">", "&gt;") ?? ""
        }</td>\n`;
      });
      resultHtml += "    </tr>\n";
    });
    resultHtml += "</table>";

    return vscode.NotebookCellOutputItem.text(resultHtml, "text/html");
  }

  private _writeJson(jsonResult: any): vscode.NotebookCellOutputItem {
    return vscode.NotebookCellOutputItem.text(jsonResult, "text/x-json");
  }

  private _writeError(error: any): vscode.NotebookCellOutput {
    return new vscode.NotebookCellOutput([
      vscode.NotebookCellOutputItem.error({
        name: "SPARQL error",
        message: error.message,
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

  dispose() {}
}
