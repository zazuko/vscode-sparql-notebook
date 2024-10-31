import { MimeType } from "../enum/mime-type";
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
}

/**
 * The EndpointController class is used to store the current endpoint.
 * 
 */
class EndpointController {
    private _endpoint: Endpoint | null = null;

    constructor() { }

    /**
     * Getter and setter for the endpoint.
     * 
     * @return The current endpoint or null if no endpoint is set.
     */
    get endpoint(): Endpoint | null {
        return this._endpoint;
    }

    /**
     * Setter for the endpoint.
     * 
     * @param endpoint The endpoint to set or null to unset the endpoint.
     * 
     */
    set endpoint(endpoint: Endpoint | null) {
        this._endpoint = endpoint;
    }
}

/**
 * The endpointController is used to store the current endpoint.
 * 
 */
export const notebookEndpoint = new EndpointController();






export interface SimpleHttpResponse {

    headers: HttpContentType,
    data: string

}

export interface HttpContentType {
    "content-type": MimeType
}