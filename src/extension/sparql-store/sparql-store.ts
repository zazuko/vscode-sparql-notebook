import { Store, defaultGraph } from 'oxigraph';
import { SPARQLQueryKind } from '../endpoint/enum/sparql-query-kind';
import { SparqlQuery } from '../endpoint/model/sparql-query';

export enum RdfMimeType {
    nTriples = 'application/n-triples',
    turtle = 'text/turtle',
    rdfXML = 'application/rdf+xml',
    trig = 'application/trig',
    nQuads = 'application/n-quads',
}
export class SparqlStore {
    // the oxigraph store
    readonly #store: Store;

    constructor() {
        this.#store = new Store();
    }

    /**
     * Can be a SELECT, ASK, CONSTRUCT or DESCRIBE query
     * 
     * @param query SPARQL query
     * @returns 
     */
    public async query(query: SparqlQuery): Promise<any> {
        // Executes a SPARQL 1.1 Query. 
        // For SELECT queries the return type is an array of Map which keys are the bound variables and values are the values the result is bound to. 
        // For CONSTRUCT and DESCRIBE queries the return type is an array of Quad. 
        // For ASK queries the return type is a boolean.

        const queryKind = query.kind;
        switch (queryKind) {
            case SPARQLQueryKind.ask:
            case SPARQLQueryKind.select:
                const res = await this._select(query);
                const fakeHttpResult = {
                    headers: { "content-type": "application/sparql-results+json" },
                    data: JSON.parse(res)
                };
                return fakeHttpResult;
            case SPARQLQueryKind.construct:
            case SPARQLQueryKind.describe:
                return this._construct(query);
            default:
                return await this.#store.query(query.queryString, {});
        }

    }

    private async _construct(query: SparqlQuery): Promise<any> {
        const ttl = (new Store(this.#store.query(query.queryString, {}))).dump(RdfMimeType.turtle, defaultGraph());
        const fakeHttpResult = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { "content-type": RdfMimeType.turtle },
            data: ttl
        };
        return fakeHttpResult;
    }

    private async _select(query: SparqlQuery): Promise<string> {
        const result = await this.#store.query(query.queryString, {
            results_format: "json",
        });
        return result;
    };


    public async update(query: SparqlQuery): Promise<any> {
        return await this.#store.update(query.queryString, {});
    }

    /**
     * 
     * @param rdfString Load RDF data into the store
     * @param mimeType Supported MIME types are: application/n-triples, text/turtle, application/rdf+xml, application/n-quads
     * @returns 
     */
    public load(rdfString: string, mimeType: RdfMimeType): void {
        const options = {
            format: mimeType,
            to_graph_name: defaultGraph()
        };

        return this.#store.load(rdfString, options, null, null);
    }

    /**
     * 
     * @param mimeType Supported MIME types are: application/n-triples, text/turtle, application/rdf+xml, application/n-quads
     * @returns Serialized RDF data
     */
    public async dump(mimeType: RdfMimeType): Promise<string> {
        const options = {
            format: mimeType,
            to_graph_name: defaultGraph()
        };
        return await this.#store.dump(options, null);
    }


    /**
     * Get the size of the store
     * @returns the number of triples in the store
     */
    public get size(): number {
        return this.#store.size;
    }

}
