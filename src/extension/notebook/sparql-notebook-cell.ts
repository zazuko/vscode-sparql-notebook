import { NotebookCell, NotebookCellExecutionSummary, NotebookCellKind, NotebookCellOutput, NotebookDocument, TextDocument, Uri, workspace } from "vscode";
import { SPARQLQueryKind, getSPARQLQueryKind } from "../endpoint/sparql-utils";
import { PrefixMap } from "../model/prefix-map";


export class SparqlNotebookCell implements NotebookCell {
    private notebookCell: NotebookCell;

    constructor(notebookCell: NotebookCell) {
        this.notebookCell = notebookCell;
    }

    get asNotebookCell(): NotebookCell {
        return this.notebookCell;
    }

    /**
     * This extracts the endpoint from the cell content. It's looking for a comment like this:
     * `# [endpoint=http://test.lindas.admin.ch/query]`and extracts the endpoint from it.
     * @returns the endpoint string or null
     */
    extractDocumentEndpoint(): string | null {
        const sparqlQuery = this.notebookCell.document.getText();
        const commentLines = sparqlQuery
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
        return endpoints.shift() ?? null;
    }

    /**
     * This extracts the kind of SPARQL query from the cell content.
     * @returns the SPARQL query kind
     * @see SPARQLQueryKind
     */
    queryKind(): SPARQLQueryKind {
        return getSPARQLQueryKind(this.notebookCell.document.getText());
    }

    getPrefixMap(): PrefixMap {
        const configuration = workspace.getConfiguration("sparqlbook");
        const useNamespaces = configuration.get("useNamespaces");
        if (!useNamespaces) {
            return {};
        }

        // get namespaces from prefixes in query
        let namespaces: PrefixMap = {};
        let prefixRegex = /[Pp][Rr][Ee][Ff][Ii][Xx] ([^:]*):[ ]*<([^>]*)>/g;

        const sparqlQuery = this.notebookCell.document.getText()
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => !l.startsWith("#")).join("\n");


        // get namespaces from prefixes in query
        let match;
        while ((match = prefixRegex.exec(sparqlQuery)) !== null) {
            namespaces[match[1]] = match[2];
        }
        return namespaces;
    }

    // NotebookCell implementation
    get document(): TextDocument {
        return this.notebookCell.document;
    }

    get executionSummary(): NotebookCellExecutionSummary | undefined {
        return this.notebookCell.executionSummary;
    }

    get index(): number {
        return this.notebookCell.index;
    }

    get kind(): NotebookCellKind {
        return this.notebookCell.kind;
    }

    get metadata(): { readonly [key: string]: any } {
        return this.notebookCell.metadata;
    }

    get notebook(): NotebookDocument {
        return this.notebookCell.notebook;
    }

    get outputs(): readonly NotebookCellOutput[] {
        return this.notebookCell.outputs;
    }
    // end of NotebookCell implementation
}