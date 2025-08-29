
import { SPARQLQueryKind } from "../../const/enum/sparql-query-kind";
import { getSPARQLQueryKind } from "../sparql-utils";
import { EndpointKind } from "../const/endpoint-kind";
import { ExtractedEndpoint } from "./extracted-endpoint";
import { EndpointSet } from "./endpoint-set";


/**
 * Represents a SPARQL query.
 * The query can be of different kinds (select, ask, construct, describe, update).
 * It can also extract endpoints and query options from the query string.
 * It can also extract query params from the query string.
 */
export class SparqlQuery {
    readonly #queryString: string;
    readonly #queryKind: SPARQLQueryKind;

    #extractedHttpOrFileEndpoint: EndpointSet | undefined = undefined;
    #extractedQueryOptions: Map<string, string> | undefined = undefined;

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
     * [endpoint=http://example.org/sparql]
     * [endpoint=../bar/foo.ttl]
     *
     * @returns 
     */
    extractEndpoint(): EndpointSet {
        if (this.#extractedHttpOrFileEndpoint === undefined) {
            this.#extractedHttpOrFileEndpoint = this.#parseEndpointComments(this.#queryString);
        }
        return this.#extractedHttpOrFileEndpoint;
    }

    #parseEndpointComments(query: string): EndpointSet {
        const commentLines = query
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.startsWith("#"));

        const matchedEndpointStringSet = new Set<string>();

        commentLines.forEach((comment: string) => {
            const endpointExp = /\[endpoint=(.*)\]/gm;
            const match = endpointExp.exec(comment);
            if (match) {
                matchedEndpointStringSet.add(match[1]);
            }
        });

        const endpoints: ExtractedEndpoint[] = [...matchedEndpointStringSet].flatMap(endpoint => {
            const kind = endpoint.startsWith("http://") || endpoint.startsWith('https://') ? EndpointKind.Http : EndpointKind.File;
            return [{ kind, endpoint }];
        });
        return new EndpointSet(endpoints);
    }

    /**
     * Extracts query options from the SPARQL query.
     * These options are specified in comments in the query string and are of the form [option=value].
     * This can be used in Oxigraph file endpoint configuration.
     *
     * @returns a map of query options.
     */
    extractQueryOptions(): Map<string, string> {
        if (this.#extractedQueryOptions === undefined) {
            this.#extractedQueryOptions = this.#parseQueryOptions(this.#queryString);
        }
        return this.#extractedQueryOptions;
    }

    #parseQueryOptions(query: string): Map<string, string> {
        const commentLines = query
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

    /**
     * Checks if the SPARQL query is an update query.
     * 
     * @returns true if the query is an update query, false otherwise.
     */
    get isUpdateQuery(): boolean {
        return [
            SPARQLQueryKind.insert,
            SPARQLQueryKind.delete,
            SPARQLQueryKind.load,
            SPARQLQueryKind.clear,
            SPARQLQueryKind.drop,
            SPARQLQueryKind.create
        ].includes(this.#queryKind);
    }
}
