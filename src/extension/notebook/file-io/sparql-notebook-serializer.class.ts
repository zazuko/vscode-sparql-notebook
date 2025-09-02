import { CancellationToken, NotebookData, NotebookSerializer } from "vscode";

import { RawNotebookCell } from "./raw-notebook-cell.model";
import { SparqlNotebookCell } from "./sparql-notebook-cell.class";


/**
 * Sparql Notebook Serializer
 * This class is responsible for serializing and deserializing the notebook
 */
export class SparqlNotebookSerializer implements NotebookSerializer {

    /**
     * Implementation of the deserializeNotebook method.
     * You don't need to call this method directly. It will be called by VS Code
     * 
     * @param content 
     * @param _token 
     * @returns 
     */
    async deserializeNotebook(
        content: Uint8Array,
        _token: CancellationToken
    ): Promise<NotebookData> {
        var contents = new TextDecoder().decode(content);

        let raw: RawNotebookCell[];
        try {
            raw = <RawNotebookCell[]>JSON.parse(contents);
        } catch {
            raw = [];
        }

        const cells = raw.map(async (item) => {
            const cellData = new SparqlNotebookCell(item.kind, item.value, item.language, item.metadata);
            return cellData;
        }
        );
        const values = await Promise.all(cells);
        return new NotebookData(values);


    }

    /**
     * Implementation of the serializeNotebook method.
     * You don't need to call this method directly. It will be called by VS Code
     * 
     * It serializes the notebook data to a json array of RawNotebookCell objects and writes the query files (.rq, .sparql) if needed.
     * @param data 
     * @param _token 
     * @returns 
     */
    async serializeNotebook(
        data: NotebookData,
        _token: CancellationToken
    ): Promise<Uint8Array> {
        let contents: RawNotebookCell[] = [];

        for (const cell of data.cells) {
            contents.push({
                kind: cell.kind,
                language: cell.languageId,
                value: cell.value,
                metadata: cell.metadata
            });
        }

        return new TextEncoder()
            .encode(
                JSON.stringify(contents, null, 2)
            );
    }
}
