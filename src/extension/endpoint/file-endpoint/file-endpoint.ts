
import { Uri, window } from 'vscode';
import * as fs from 'fs';

import { Endpoint } from '../endpoint';
import { RdfMimeType, SparqlStore } from '../../sparql-store/sparql-store';
import { SparqlQuery } from '../model/sparql-query';

/**
 * Represents an HTTP SPARQL endpoint.
 */
export class FileEndpoint extends Endpoint {
    private _url: string = '';
    private files: Set<Uri> = new Set<Uri>();
    private _store: SparqlStore;
    /**
     * Creates a new instance of the HttpEndpoint class.
     * @param endpointUrl - The URL of the SPARQL endpoint.
     * @param user - The username for authentication.
     * @param password - The password for authentication.
     */
    constructor() {
        super();
        this._store = new SparqlStore();
    }

    get url(): string {
        return this._url;
    }

    public async addFile(rdfFile: Uri) {
        this._url = rdfFile.path;
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
            this._store.load(fileContent, mimeType);
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
        const res = this._store.query(sparqlQuery.queryString);
        return res;
    }
}
