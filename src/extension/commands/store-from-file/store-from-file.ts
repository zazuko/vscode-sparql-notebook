import { Uri, window } from 'vscode';
import { FileEndpoint } from '../../endpoint/file-endpoint/file-endpoint';
import { notebookEndpoint } from '../../endpoint/endpoint';
import { SparqlNotebookCellStatusBarItemProvider } from '../../notebook/SparqlNotebookCellStatusBarItemProvider';


export function createStoreFromFile(sparqlNotebookCellStatusBarItemProvider: SparqlNotebookCellStatusBarItemProvider) {
    return async (rdfFile: Uri) => {

        const fileEndpoint = new FileEndpoint();
        try {
            await fileEndpoint.addFile(rdfFile);
            notebookEndpoint.setEndpoint(fileEndpoint);
            sparqlNotebookCellStatusBarItemProvider.updateCellStatusBarItems();
        } catch (e) {
            window.showErrorMessage('Error loading file: ' + e);
        }

    };
}
