
export abstract class Endpoint {
    abstract query(sparqlQuery: string, execution?: any): Promise<any>;
}

class EndpointController {
    private _endpoint: Endpoint | null = null;

    constructor() { }

    getEndpoint(): Endpoint | null {
        return this._endpoint;
    }

    setEndpoint(endpoint: Endpoint | null) {
        this._endpoint = endpoint;
    }
}

export const notebookEndpoint = new EndpointController();