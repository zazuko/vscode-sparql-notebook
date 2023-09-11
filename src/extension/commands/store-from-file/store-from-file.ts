import { Uri } from 'vscode';
import { FileEndpoint } from '../../endpoint/file-endpoint/file-endpoint';
import { notebookEndpoint } from '../../endpoint/endpoint';


export const createStoreFromFile = async (rdfFile: Uri) => {
    const fileEndpoint = new FileEndpoint();
    await fileEndpoint.addFile(rdfFile);
    notebookEndpoint.setEndpoint(fileEndpoint);
};
