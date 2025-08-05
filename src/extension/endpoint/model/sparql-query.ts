import { window } from "vscode";

import { SPARQLQueryKind } from "../../const/enum/sparql-query-kind";
import { getSPARQLQueryKind } from "../sparql-utils";

export class SparqlQuery {
    readonly #queryString: string;
    readonly #queryKind: SPARQLQueryKind;

    #extractedEndpointCollection: EndpointCollection | undefined = undefined;

    /**
     * Creates a new instance of the SparqlQuery class.
     * @param queryString - The SPARQL query string.
     */
    constructor(queryString: string) {
        this.#queryString = queryString;
        this.#queryKind = getSPARQLQueryKind(queryString);
    }

    /**
     * Getter for the SPARQL query string.
     */
    get queryString(): string {
        return this.#queryString;
    }

    /**
     * Getter for the SPARQL query kind.
     */
    get kind(): SPARQLQueryKind {
        return this.#queryKind;
    }

    /**
     * Try to extract the endpoint from the SPARQL query. Looks for a line like:
     * [endpoint: <http://example.org/sparql>]
     * 
     * @returns the endpoint url or undefined if not found
     */
    extractEndpoint(): EndpointCollection {
        if (this.#extractedEndpointCollection !== undefined) {
            return this.#extractedEndpointCollection;
        }
        const commentLines = this.#queryString
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.startsWith("#"));
        const endpointsSet = new Set<string>();
        commentLines.forEach((comment: string) => {
            const endpointExp = /\[endpoint=(.*)\]/gm;
            const match = endpointExp.exec(comment);
            if (match) {
                endpointsSet.add(match[1]);
            }
        });

        const endpoints: ExtractedEndpoint[] = [...endpointsSet].flatMap(endpoint => {
            const kind = endpoint.startsWith("http://") || endpoint.startsWith('https://') ? EndpointKind.Http : EndpointKind.File;
            return [{ kind, endpoint }];
        });
        this.#extractedEndpointCollection = new EndpointCollection(endpoints);
        return this.#extractedEndpointCollection;
    }

    extractQueryOptions(): Map<string, string> {
        const commentLines = this.#queryString
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.startsWith("#"));
        const queryOptionsMap = new Map<string, string>();
        commentLines.forEach((comment: string) => {
            const optionExp = /\[([a-zA-Z_]+)=([^\]]+)\]/gm;
            const match = optionExp.exec(comment);

            if (match) {
                if (match[1] !== 'endpoint') {
                    queryOptionsMap.set(match[1], match[2]);
                }
            }

        });
        return queryOptionsMap;

    }
}


export enum EndpointKind {
    File = 'file',
    Http = 'http'
}

export interface ExtractedEndpoint {
    kind: EndpointKind;
    endpoint: string;
}

export class EndpointCollection {
    readonly #endpoints: ExtractedEndpoint[];

    constructor(endpoints: ExtractedEndpoint[]) {
        this.#endpoints = endpoints;
    }

    get #hasHttpEndpoint(): boolean {
        return this.#endpoints.some(e => e.kind === 'http');
    }

    get #hasFileEndpoint(): boolean {
        return this.#endpoints.some(e => e.kind === 'file');
    }

    /**
     * Get the configured endpoints from the SPARQL query. The output is an array of endpoints.
     * If the query contains both file and http endpoints, an error message is shown and an empty array is returned.
     * If the query contains multiple http endpoints, an error message is shown and an empty array is returned.
     * If all is ok the array of endpoints is returned. 
     * @returns the extracted endpoints from the SPARQL query.
     */
    getEndpoints(): ExtractedEndpoint[] {
        if (this.#endpoints.length === 0) {
            return [];
        }
        if (this.#hasFileEndpoint && this.#hasHttpEndpoint) {
            window.showWarningMessage('SPARQL query contains both file and http endpoints. Please remove one of them.');
            return [];
        }

        if (this.#hasHttpEndpoint && this.#endpoints.length > 1) {
            window.showWarningMessage('SPARQL query contains multiple http endpoints. Please remove all but one.');
            return [];
        }
        return this.#endpoints;
    }

}