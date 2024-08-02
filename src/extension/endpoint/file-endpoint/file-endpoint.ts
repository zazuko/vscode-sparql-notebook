
import { Uri, window } from 'vscode';
import * as fs from 'fs';

import { Endpoint } from '../endpoint';
import { RdfMimeType, SparqlStore } from '../../sparql-store/sparql-store';
import { SparqlQuery } from '../model/sparql-query';

/**
 * Represents an HTTP SPARQL endpoint.
 */
export class FileEndpoint extends Endpoint {
    #url: string = '';
    readonly #files: Set<Uri> = new Set<Uri>();
    readonly #store: SparqlStore;

    /**
     * Creates a new instance of the HttpEndpoint class.
     * @param endpointUrl - The URL of the SPARQL endpoint.
     * @param user - The username for authentication.
     * @param password - The password for authentication.
     */
    constructor() {
        super();
        this.#store = new SparqlStore();
    }

    /**
     * Getter for the URL of the SPARQL endpoint. In this case a file path.
     * 
     * @returns The URL of the SPARQL endpoint.
     */
    get url(): string {
        return this.#url;
    }

    /**
     * Adds a file to the endpoint.
     * 
     * @param rdfFile - The file to add.
     */
    public async addFile(rdfFile: Uri): Promise<void> {
        this.#url = rdfFile.path;
        if (!rdfFile) {
            // show window error message
            window.showErrorMessage('No file selected');
            return;
        }
        let mimeType: RdfMimeType | undefined = undefined;
        if (rdfFile.fsPath.endsWith('.ttl')) {
            mimeType = RdfMimeType.turtle;
        } else if (rdfFile.fsPath.endsWith('.nt')) {
            mimeType = RdfMimeType.nTriples;
        } else if (rdfFile.fsPath.endsWith('.rdf')) {
            mimeType = RdfMimeType.rdfXML;
        } else if (rdfFile.fsPath.endsWith('.trig')) {
            mimeType = RdfMimeType.trig;
        } else if (rdfFile.fsPath.endsWith('.nq')) {
            mimeType = RdfMimeType.nQuads;
        }
        if (!mimeType) {
            // show window error message
            window.showErrorMessage('File format not supported');
            return;
        }

        try {
            const fileContent = await fs.promises.readFile(rdfFile.fsPath, 'utf-8');
            this.#store.load(fileContent, mimeType);
        } catch (e: any) {
            const message = e.message ?? e;
            window.showErrorMessage(`File error: ${message}`);
            console.error(e);
        }
    }

    /**
     * Executes a SPARQL query against the endpoint.
     * @param sparqlQuery - The SPARQL query to execute.
     * @param execution - The execution object.
     */
    public async query(sparqlQuery: SparqlQuery, execution?: any): Promise<any> {
        const res = this.#store.query(sparqlQuery);
        return res;
    }
}
