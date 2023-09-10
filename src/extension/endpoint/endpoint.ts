
export abstract class Endpoint {
    abstract query(sparqlQuery: string, execution?: any): Promise<any>;
}