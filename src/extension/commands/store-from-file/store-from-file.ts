import { Uri, window } from 'vscode';
import { FileEndpoint } from '../../endpoint/file-endpoint/file-endpoint';
import { notebookEndpoint } from '../../endpoint/endpoint';


export const createStoreFromFile = async (rdfFile: Uri) => {

    const fileEndpoint = new FileEndpoint();
    try {
        await fileEndpoint.addFile(rdfFile);
        notebookEndpoint.setEndpoint(fileEndpoint);
    } catch (e) {
        window.showErrorMessage('Error loading file: ' + e);
    }

};
