import { SPARQLQueryKind } from "../enum/sparql-query-kind";
import { getSPARQLQueryKind } from "../sparql-utils";

export class SparqlQuery {
    readonly #queryString: string;
    readonly #queryKind: SPARQLQueryKind;

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
    extractEndpoint(): string | undefined {
        const commentLines = this.#queryString
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.startsWith("#"));
        const endpointExp = /\[endpoint=(.*)\]/gm;
        const endpoints: string[] = [];
        commentLines.every((comment: string) => {
            const match = endpointExp.exec(comment);
            if (match) {
                endpoints.push(match[1]);
                return false;
            }
            return true;
        });
        return endpoints.shift() ?? undefined;
    }

    /**
     * Try to extract the file path from the SPARQL query. Looks for a line like:
     * [file: <path/to/file>]
     * 
     * @returns the file path or undefined if not found
     */
    extractFilePath(): string | undefined {
        console.log('extractFilePath: not implemented');
        return undefined;
    }

}