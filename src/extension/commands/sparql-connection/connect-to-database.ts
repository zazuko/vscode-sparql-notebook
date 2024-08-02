import { ExtensionContext, window } from 'vscode';
import {
    EndpointConfiguration,
    EndpointConnectionListItem,
    EndpointConnections,
} from "../../sparql-connection-menu";

import { HttpEndpoint } from "../../endpoint";

import { storageKey } from "../../extension";
import { notebookEndpoint } from '../../endpoint/endpoint';
import { SparqlNotebookCellStatusBarItemProvider } from '../../notebook/SparqlNotebookCellStatusBarItemProvider';
import { SparqlQuery } from '../../endpoint/model/sparql-query';


export function connectToDatabase(
    context: ExtensionContext,
    connectionsSidepanel: EndpointConnections,
    sparqlNotebookCellStatusBarItemProvider: SparqlNotebookCellStatusBarItemProvider
) {
    return async (item?: EndpointConnectionListItem) => {
        let selectedName = item?.config.name;

        if (selectedName === undefined) {
            // no item selected, show quick pick
            const connectionNameList = context.globalState
                .get(storageKey, [])
                .map(({ name }) => name);

            const namePicked = await window.showQuickPick(connectionNameList, {
                ignoreFocusOut: true,
            });

            if (namePicked === undefined) {
                window.showErrorMessage(`Invalid database connection name.`);
                return;
            }
            selectedName = namePicked;
        }

        // find the connection config
        const match = context.globalState
            .get<EndpointConfiguration[]>(storageKey, [])
            .find(connection => connection.name === selectedName);


        if (match === undefined) {
            // connection not found
            window.showErrorMessage(
                `"${selectedName}" not found. Please add the connection config in the sidebar before connecting.`
            );
            return;
        }

        // get the password from the secret store
        const passwordFromStore = await context.secrets.get(match.passwordKey);
        const password = passwordFromStore ?? '';

        const connectionData = {
            name: match.name,
            endpointURL: match.endpointURL,
            user: match.user,
            passwordKey: password,
        };
        try {
            const endpoint = new HttpEndpoint(connectionData.endpointURL, connectionData.user, connectionData.passwordKey);

            // test the connection
            await endpoint.query(new SparqlQuery("SELECT * WHERE {?s ?p ?o.} LIMIT 1"));
            notebookEndpoint.endpoint = endpoint;
            connectionsSidepanel.setActive(match.name);
            window.showInformationMessage(
                `Successfully connected to "${match.name}"`
            );
        } catch (err: any) {
            console.warn(err);
            window.showErrorMessage(
                `Failed to connect to "${match.name}": ${err?.message}`
            );
            notebookEndpoint.endpoint = null;
            connectionsSidepanel.setActive(null);
        }
        sparqlNotebookCellStatusBarItemProvider.updateCellStatusBarItems();
    };
}
