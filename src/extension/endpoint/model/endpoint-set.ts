import { window } from "vscode";
import { ExtractedEndpoint } from "./extracted-endpoint";

/**
 * Class representing a set of SPARQL endpoints.
 * It can contain multiple endpoints of different kinds (file, http).
 */
export class EndpointSet {
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
     * Get the configured endpoints from the SPARQL query.
     * 
     * The output is an array of endpoints.
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
