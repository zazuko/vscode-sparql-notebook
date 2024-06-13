import {
    NotebookCellStatusBarItem,
    NotebookCellStatusBarAlignment
} from 'vscode';
import { SparqlNotebookCell } from './sparql-notebook-cell';
import { notebookEndpoint } from '../endpoint/endpoint';

// we have 3 possible notebook cell status bar items
// 1. the connection source - it could be be connected to a "global" notebook connection from the cell
// 2. then we have the text of the cell can come from a file or it's from the cell itself
// 3. i don't remember that one

// create an enum for ConnectionSource

export enum ConnectionSource {
    notebook = "Notebook",
    file = "File",
    cell = "Cell",
    none = "None"
}

export class ConnectionSourceStatusBarItem extends NotebookCellStatusBarItem {
    private readonly icon = ' $(link)';
    private itemText = 'Notebook Connection';
    constructor(cell: SparqlNotebookCell, alignment: NotebookCellStatusBarAlignment) {
        super('', alignment);
        const sparqlQuery = cell.sparqlQuery;
        let commentEndpoint = sparqlQuery.extractEndpoint();
        if (commentEndpoint) {
            this.itemText = `Query Comment`;
        }

        this.text = `${this.icon} ${this.itemText} ${commentEndpoint ?? notebookEndpoint.endpoint?.url ? ((commentEndpoint ?? notebookEndpoint.endpoint?.url)?.startsWith('http') ? `$(database)` : '$(file)') : '$(circle-slash)'}`;
        this.tooltip = `Endpoint: ${commentEndpoint ?? notebookEndpoint.endpoint?.url ?? "None"}`;
    }
}



export class CellContentStatusBarItem extends NotebookCellStatusBarItem {
    private readonly icon = ' $(code)';
    private itemText = 'Cell';

    constructor(cell: SparqlNotebookCell, alignment: NotebookCellStatusBarAlignment) {
        super('', alignment);

        if (cell.metadata.file) {
            this.itemText = 'File';
        }
        this.text = `${this.icon} ${this.itemText}`;
        this.tooltip = `Cell text source: ${cell.metadata.file ?? "Cell"}`;
    }
}