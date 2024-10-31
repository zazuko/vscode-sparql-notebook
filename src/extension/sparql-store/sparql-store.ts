import { Quad, Store, defaultGraph } from 'oxigraph';
import { SPARQLQueryKind } from '../endpoint/enum/sparql-query-kind';
import { SparqlQuery } from '../endpoint/model/sparql-query';

export enum RdfMimeType {
    nTriples = 'application/n-triples',
    turtle = 'text/turtle',
    rdfXML = 'application/rdf+xml',
    trig = 'application/trig',
    nQuads = 'application/n-quads',
}

/**
 * This is the local SPARQL endpoint that is used to execute SPARQL queries on the local RDF store.
 * It is based on the Oxigraph.
 */
export class SparqlStore {
    // the oxigraph store
    readonly #store: Store;

    constructor() {
        this.#store = new Store();
    }

    /**
     * Execute a SPARQL CONSTRUCT query and return the result as a turtle string.
     * 
     * @param query SPARQL query of type CONSTRUCT
     * @returns the turtle string
     * @throws Error if the query is not a CONSTRUCT query
     */
    construct(query: SparqlQuery): string | never {
        if (query.kind !== SPARQLQueryKind.construct) {
            throw new Error('Query is not a CONSTRUCT query');
        }

        const queryResult = this.#store.query(query.queryString, {
            results_format: RdfMimeType.turtle,
        }) as string;

        return queryResult;
    }

    /**
     * Execute a SPARQL CONSTRUCT query and return the result as an array of quads.
     * 
     * @param query SPARQL query of type CONSTRUCT
     * @returns the array of quads
     * @throws Error if the query is not a CONSTRUCT query
     */
    constructQuads(query: SparqlQuery): Quad[] | never {
        if (query.kind !== SPARQLQueryKind.construct) {
            throw new Error('Query is not a CONSTRUCT query');
        }

        const queryResult = this.#store.query(query.queryString) as Quad[];

        return queryResult;
    }

    /**
     * Execute a SPARQL SELECT query and return the result as a JSON string.
     * 
     * @param query SPARQL query of type SELECT
     * @returns the JSON string
     * @throws Error if the query is not a SELECT query
     */
    select(query: SparqlQuery): string | never {
        if (query.kind !== SPARQLQueryKind.select) {
            throw new Error('Query is not a SELECT query');
        }

        const queryResult = this.#store.query(query.queryString, {
            results_format: 'json',
        }) as string;

        return queryResult;
    }

    /**
     * Execute a SPARQL ASK query
     * 
     * @param query SPARQL query of type ASK
     * @returns the JSON string
     */
    ask(query: SparqlQuery): string | never {
        if (query.kind !== SPARQLQueryKind.ask) {
            throw new Error('Query is not an ASK query');
        }
        const result = this.#store.query(query.queryString, {
            results_format: "json",
        }) as string;
        return result;
    }

    /**
     * Execute a SPARQL DESCRIBE query and return the result as a turtle string.
     * 
     * @param query SPARQL query of type DESCRIBE
     * @returns the turtle string
     */
    describe(query: SparqlQuery): string | never {
        if (query.kind !== SPARQLQueryKind.describe) {
            throw new Error('Query is not a DESCRIBE query');
        }

        const queryResult = this.#store.query(query.queryString, {
            results_format: RdfMimeType.turtle,
        }) as string;

        return queryResult;
    }

    describeQuads(query: SparqlQuery): Quad[] | never {
        if (query.kind !== SPARQLQueryKind.describe) {
            throw new Error('Query is not a DESCRIBE query');
        }

        const queryResult = this.#store.query(query.queryString) as Quad[];

        return queryResult;
    }


    /**
     * Load an RDF string into the store.
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

        this.#store.load(rdfString, options);
    }

    /**
     * Dump the store into an RDF string.
     * 
     * @param mimeType Supported MIME types are: application/n-triples, text/turtle, application/rdf+xml, application/n-quads
     * @returns Serialized RDF data
     */
    public dump(mimeType: RdfMimeType): string {
        const options = {
            format: mimeType,
            to_graph_name: defaultGraph()
        };
        return this.#store.dump(options);
    }

    /**
     * Get the size of the store
     * @returns the number of triples in the store
     */
    public get size(): number {
        return this.#store.size;
    }

}


/**
     const fakeHttpResult = {
                    headers: { "content-type": "application/sparql-results+json" },
                    data: JSON.parse(res)
                };
 */