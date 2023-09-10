import { Uri, window } from 'vscode';
import { RdfMimeType, SparqlStore } from '../../sparql-store/sparql-store';
import * as fs from 'fs';

export const createStoreFromFile = async (rdfFile: Uri) => {
    if (!rdfFile) {
        // show window error message
        window.showErrorMessage('No file selected');
        return;
    }
    let mimeType: RdfMimeType | undefined = undefined;
    if (rdfFile.fsPath.endsWith('.ttl')) {
        mimeType = RdfMimeType.turtle;
    } else if (rdfFile.fsPath.endsWith('.nt')) {
        mimeType = RdfMimeType.nTriples;
    } else if (rdfFile.fsPath.endsWith('.rdf')) {
        mimeType = RdfMimeType.rdfXML;
    } else if (rdfFile.fsPath.endsWith('.trig')) {
        mimeType = RdfMimeType.trig;
    } else if (rdfFile.fsPath.endsWith('.nq')) {
        mimeType = RdfMimeType.nQuads;
    }
    if (!mimeType) {
        // show window error message
        window.showErrorMessage('File format not supported');
        return;
    }
    const fileContent = await loadFileContent(rdfFile.fsPath);
    const store = new SparqlStore();
    console.time('load');
    store.load(fileContent, mimeType);
    console.timeEnd('load');
    console.log('storeFromFile', store.size);

};


async function loadFileContent(filePath: string): Promise<string> {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    return fileContent;
}