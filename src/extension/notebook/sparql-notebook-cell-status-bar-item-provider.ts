import {
    NotebookCellStatusBarItem,
    NotebookCellStatusBarAlignment
} from 'vscode';
import { SparqlNotebookCell } from './sparql-notebook-cell';
import { notebookEndpoint } from '../endpoint/endpoint';
import { EndpointKind } from "../endpoint/const/endpoint-kind";

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
    readonly #sparqlEndpointIcon = ' $(link)';
    #endpointSource: EndpointSource = EndpointSource.notConnected;
    #endpointSourceIcon: EndpointKindIcon = EndpointKindIcon.NotConnected;

    constructor(cell: SparqlNotebookCell, alignment: NotebookCellStatusBarAlignment) {
        super('', alignment);
        const sparqlQuery = cell.sparqlQuery;
        let endpointsFromCell = sparqlQuery.extractEndpoint().getEndpoints();
        if (endpointsFromCell.length > 0) {
            if (endpointsFromCell[0].kind === EndpointKind.Http) {
                this.#endpointSource = EndpointSource.cell;
                this.#endpointSourceIcon = EndpointKindIcon.Http;
            } else if (endpointsFromCell[0].kind === EndpointKind.File) {
                this.#endpointSource = EndpointSource.cell;
                this.#endpointSourceIcon = EndpointKindIcon.File;
            }
        } else if (notebookEndpoint.endpoint) {
            this.#endpointSource = EndpointSource.notebookEndpointConnection;
            this.#endpointSourceIcon = EndpointKindIcon.NotConnected;
        }


        this.text = `${this.#sparqlEndpointIcon} ${this.#endpointSource} ${this.#endpointSourceIcon}`;
        this.tooltip = `Endpoint: ${this.#endpointSource}`;
    }
}



export class CellContentStatusBarItem extends NotebookCellStatusBarItem {
    private readonly defaultIcon = ' $(code)';
    private readonly defaultText = 'Cell';

    constructor(cell: SparqlNotebookCell, alignment: NotebookCellStatusBarAlignment) {
        super('', alignment);

        if (cell.metadata?.['file']) {
            this.text = `$(file-symlink-file) Linked: ${cell.metadata['file']}`;
            this.tooltip = `Cell is bound to external file: ${cell.metadata['file']}`;
        } else {
            this.text = `${this.defaultIcon} ${this.defaultText}`;
            this.tooltip = `Cell text source: Cell`;
        }
    }
}

enum EndpointSource {
    cell = 'Cell Comment',
    notebookEndpointConnection = 'Endpoint Connection',
    notConnected = 'Not Connected'
}

enum EndpointKindIcon {
    File = '$(file)',
    Http = '$(database)',
    NotConnected = '$(circle-slash)'
}