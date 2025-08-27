import { SparqlQuery } from "./model/sparql-query";

/**
 * Abstract class for endpoints. 
 * 
 * @abstract
 * 
 */
export abstract class Endpoint {
    public abstract url: string;
    abstract query(sparqlQuery: SparqlQuery, execution?: any): Promise<SimpleHttpResponse> | never;
    abstract readonly isQLeverEndpoint: boolean;
}

/**
 * The EndpointController class is used to store the current endpoint.
 * 
 */
class EndpointController {
    #endpoint: Endpoint | null = null;
    #updateEndpoint: Endpoint | null = null;

    constructor() { }

    /**
     * Getter and setter for the endpoint.
     * 
     * @return The current endpoint or null if no endpoint is set.
     */
    get endpoint(): Endpoint | null {
        return this.#endpoint;
    }

    /**
     * Getter for the update endpoint.
     */
    get updateEndpoint(): Endpoint | null {
        return this.#updateEndpoint;
    }

    /**
     * Setter for the update endpoint.
     * 
     * @param endpoint The endpoint to set or null to unset the endpoint.
     * 
     */
    set endpoint(endpoint: Endpoint | null) {
        this.#endpoint = endpoint;
    }

    /**
     * Setter for the update endpoint.
     * 
     * @param endpoint The endpoint to set or null to unset the endpoint.
     * 
     */
    set updateEndpoint(endpoint: Endpoint | null) {
        this.#updateEndpoint = endpoint;
    }
}

/**
 * The endpointController is used to store the current endpoint.
 * 
 */
export const notebookEndpoint = new EndpointController();

export interface SimpleHttpResponse {

    headers: HttpContentType,
    data: string,
    status: number,
    statusText: string

}

export interface HttpContentType {
    "content-type": string
}