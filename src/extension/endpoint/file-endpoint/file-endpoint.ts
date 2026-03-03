
import { Uri, window } from 'vscode';
import * as fs from 'fs';

import { Endpoint, SimpleHttpResponse } from '../endpoint';
import { RdfMimeType, SparqlStore } from '../../sparql-store/sparql-store';
import { SparqlQuery } from '../model/sparql-query';
import { SPARQLQueryKind } from "../../const/enum/sparql-query-kind";
import { MimeType } from '../../const/enum/mime-type';

/**
 * Represents an HTTP SPARQL endpoint.
 */
export class FileEndpoint extends Endpoint {
    override isQLeverEndpoint: boolean = false;

    #url: string = '';
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

    useDefaultGraphAsUnion() {
        this.#store.setQueryOptions({ use_default_graph_as_union: true });
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

        const mimeType = this.getMimeType(rdfFile);

        if (!mimeType) {
            // show window error message
            window.showErrorMessage('File format not supported');
            return;
        }

        try {
            const fileContent = await fs.promises.readFile(rdfFile.fsPath, 'utf-8');
            this.#store.load(fileContent, mimeType, rdfFile);
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
    public async query(sparqlQuery: SparqlQuery, execution?: any): Promise<SimpleHttpResponse> | never {
        const handler = this.getQueryKindHandler(sparqlQuery.kind);

        if (!handler) {
            throw new Error(`Query type "${sparqlQuery.kind}" is not supported by FileEndpoint`);
        }

        return {
            headers: { 'content-type': handler.contentType },
            data: handler.execute(sparqlQuery),
            status: 200,
            statusText: 'OK'
        };
    }

    private getMimeType(rdfFile: Uri): RdfMimeType | undefined {
        if (rdfFile.fsPath.endsWith('.ttl')) {
            return RdfMimeType.turtle;
        } else if (rdfFile.fsPath.endsWith('.nt')) {
            return RdfMimeType.nTriples;
        } else if (rdfFile.fsPath.endsWith('.rdf')) {
            return RdfMimeType.rdfXML;
        } else if (rdfFile.fsPath.endsWith('.trig')) {
            return RdfMimeType.trig;
        } else if (rdfFile.fsPath.endsWith('.nq')) {
            return RdfMimeType.nQuads;
        }
        return undefined;
    }

    private getQueryKindHandler(kind: SPARQLQueryKind): { contentType: string, execute: (query: SparqlQuery) => any } | undefined {
        switch (kind) {
            case SPARQLQueryKind.ask:
                return {
                    contentType: MimeType.sparqlResultsJson,
                    execute: (q) => this.#store.ask(q)
                };
            case SPARQLQueryKind.select:
                return {
                    contentType: MimeType.sparqlResultsJson,
                    execute: (q) => this.#store.select(q)
                };
            case SPARQLQueryKind.describe:
                return {
                    contentType: MimeType.turtle,
                    execute: (q) => this.#store.describe(q)
                };
            case SPARQLQueryKind.construct:
                return {
                    contentType: MimeType.turtle,
                    execute: (q) => this.#store.construct(q)
                };
            default:
                return undefined;
        }
    }

    /**
     * SHACL validation is not supported for file endpoint.
     * @param shaclGraphAsTurtle - The SHACL graph in Turtle format.
     * @param execution - The execution object.
     */
    public async validate(shaclGraphAsTurtle: string, execution?: any): Promise<SimpleHttpResponse> {
        throw new Error("SHACL validation is not supported for file endpoints.");
    }
}
