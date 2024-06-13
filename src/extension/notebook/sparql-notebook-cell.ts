import { NotebookCell, NotebookCellExecutionSummary, NotebookCellKind, NotebookCellOutput, NotebookDocument, TextDocument, Uri, workspace } from "vscode";
import { PrefixMap } from "../model/prefix-map";
import { SparqlQuery } from "../endpoint/model/sparql-query";

/**
 * This class wraps a NotebookCell and provides additional functionality for SPARQL queries.
 * 
 * The additional functionalities are:
 * - Contains a SPARQL query Object
 * - Contains a PrefixMap
 * 
 * 
 * @implements NotebookCell
 * 
 */
export class SparqlNotebookCell implements NotebookCell {
    readonly #notebookCell: NotebookCell;
    readonly #sparqlQuery: SparqlQuery;

    constructor(notebookCell: NotebookCell) {
        this.#notebookCell = notebookCell;
        this.#sparqlQuery = new SparqlQuery(this.#notebookCell.document.getText());
    }

    /**
     * Returns the wrapped NotebookCell.
     * 
     * @returns the wrapped NotebookCell
     */
    get cell(): NotebookCell {
        return this.#notebookCell;
    }

    /**
     * Returns the SPARQL query from the cell content.
     * 
     * @returns the SPARQL query
     */
    get sparqlQuery(): SparqlQuery {
        return this.#sparqlQuery;
    }

    /**
     * Returns the PrefixMap from the SPARQL query.
     * 
     * The PrefixMap is extracted from the prefixes in the SPARQL query.
     * 
     * @returns the PrefixMap
     */
    getPrefixMap(): PrefixMap {
        const configuration = workspace.getConfiguration("sparqlbook");
        const useNamespaces = configuration.get("useNamespaces");
        if (!useNamespaces) {
            return {};
        }
        return this.#extractPrefixMapFromQuery();
    }

    /**
     * Extracts the PrefixMap from the SPARQL query.
     * 
     * The PrefixMap is extracted from the prefixes in the SPARQL query.
     * 
     * @returns the PrefixMap
     */
    #extractPrefixMapFromQuery(): PrefixMap {
        // get namespaces from prefixes in query
        let namespaces: PrefixMap = {};
        let prefixRegex = /[Pp][Rr][Ee][Ff][Ii][Xx] ([^:]*):[ ]*<([^>]*)>/g;

        const queryStringWithoutComment = this.#sparqlQuery.queryString
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => !l.startsWith("#")).join("\n");


        // get namespaces from prefixes in query
        let match;
        while ((match = prefixRegex.exec(queryStringWithoutComment)) !== null) {
            namespaces[match[1]] = match[2];
        }
        return namespaces;
    }

    // NotebookCell implementation
    get document(): TextDocument {
        return this.#notebookCell.document;
    }

    get executionSummary(): NotebookCellExecutionSummary | undefined {
        return this.#notebookCell.executionSummary;
    }

    get index(): number {
        return this.#notebookCell.index;
    }

    get kind(): NotebookCellKind {
        return this.#notebookCell.kind;
    }

    get metadata(): { readonly [key: string]: any } {
        return this.#notebookCell.metadata;
    }

    get notebook(): NotebookDocument {
        return this.#notebookCell.notebook;
    }

    get outputs(): readonly NotebookCellOutput[] {
        return this.#notebookCell.outputs;
    }
    // end of NotebookCell implementation
}