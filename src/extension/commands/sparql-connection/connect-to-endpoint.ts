import { ExtensionContext, window } from 'vscode';

import { HttpEndpoint } from "../../endpoint";
import { storageKey } from "../../extension";
import { notebookEndpoint } from '../../endpoint/endpoint';
import { SparqlNotebookCellStatusBarItemProvider } from '../../notebook/SparqlNotebookCellStatusBarItemProvider';
import { SparqlQuery } from '../../endpoint/model/sparql-query';
import { EndpointConnectionTreeDataProvider } from '../../sparql-connection-menu/endpoint-tree-data-provider.class';
import { EndpointConnectionListItem } from '../../sparql-connection-menu/endpoint-connection-list-item.class';
import { EndpointConfiguration } from '../../model/endpoint-configuration';


/**
 * Connect to a SPARQL endpoint
 * 
 * @param context The extension context.
 * @param connectionsSidepanel The connections side panel.
 * @param sparqlNotebookCellStatusBarItemProvider The SPARQL notebook cell status bar item provider.
 * @returns A function that connects to the endpoint.
 */
export function connectToEndpoint(
    context: ExtensionContext,
    connectionsSidepanel: EndpointConnectionTreeDataProvider,
    sparqlNotebookCellStatusBarItemProvider: SparqlNotebookCellStatusBarItemProvider
) {
    return async (item?: EndpointConnectionListItem) => {
        let selectedName = item?.config.name;

        if (selectedName === undefined) {
            // no item selected, show quick pick
            const connectionNameList = context.globalState.get(storageKey, []).map(({ name }) => name);

            const namePicked = await window.showQuickPick(connectionNameList, { ignoreFocusOut: true });

            if (namePicked === undefined) {
                window.showErrorMessage(`Invalid endpoint connection name.`);
                return;
            }
            selectedName = namePicked;
        }

        // find the connection configuration
        const endpointConfiguration = context.globalState.get<EndpointConfiguration[]>(storageKey, []).find(connection => connection.name === selectedName);


        if (endpointConfiguration === undefined) {
            // connection not found
            window.showErrorMessage(
                `"${selectedName}" not found. Please add the connection config in the sidebar before connecting.`
            );
            return;
        }

        // get the password from the secret store
        const passwordFromStore = await context.secrets.get(endpointConfiguration.passwordKey);
        const password = passwordFromStore ?? '';

        const connectionData: EndpointConfiguration = {
            name: endpointConfiguration.name,
            endpointURL: endpointConfiguration.endpointURL,
            user: endpointConfiguration.user,
            passwordKey: password,
        };
        const testedHttpEndpoint = await testConnectionWithConfiguration(connectionData);
        if (!testedHttpEndpoint) {
            notebookEndpoint.endpoint = null;
            connectionsSidepanel.setActive(null);
        } else {
            notebookEndpoint.endpoint = testedHttpEndpoint;
            connectionsSidepanel.setActive(connectionData.name);
            window.showInformationMessage(`Successfully connected to "${connectionData.name}"`);
        }
        // update the status bar of all SPARQL notebook cells
        sparqlNotebookCellStatusBarItemProvider.updateCellStatusBarItems();
    };
}


async function testConnectionWithConfiguration(config: EndpointConfiguration): Promise<HttpEndpoint | null> {
    try {
        const endpoint = new HttpEndpoint(config.endpointURL, config.user, config.passwordKey);

        const result = await endpoint.query(new SparqlQuery("SELECT * WHERE {?s ?p ?o.} LIMIT 1"));
        if (!result || result.status !== 200) {
            window.showErrorMessage(
                `Failed to connect to "${config.name}". HTTP status: ${result?.status} ${result?.statusText ?? ''}`
            );
            return null;
        }
        return endpoint;
    } catch (err: any) {
        console.warn(err);
        window.showErrorMessage(
            `Failed to connect to "${config.name}": ${err?.message}`
        );
        return null;
    }
}
