import { getSPARQLQueryKind, SPARQLQueryKind } from "../sparql-utils";

export class SparqlQuery {
    _queryString = '';
    _queryKind = SPARQLQueryKind.unknown;

    /**
     * Creates a new instance of the SparqlQuery class.
     * @param queryString - The SPARQL query string.
     */
    constructor(queryString: string) {
        this._queryString = queryString;
        this._queryKind = getSPARQLQueryKind(queryString);
    }

    /**
     * Getter for the SPARQL query string.
     */
    get queryString(): string {
        return this._queryString;
    }

    /**
     * Getter for the SPARQL query kind.
     */
    get kind(): SPARQLQueryKind {
        return this._queryKind;
    }

    /**
     * Try to extract the endpoint from the SPARQL query. Looks for a line like:
     * [endpoint: <http://example.org/sparql>]
     * 
     * @returns the endpoint url or undefined if not found
     */
    extractEndpoint(): string | undefined {
        console.log('extractEndpoint: not implemented');
        return undefined;
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