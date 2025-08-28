import { ExtensionContext, window } from 'vscode';

import { HttpEndpoint } from "../../endpoint";
import { storageKey } from "../../extension";
import { notebookEndpoint } from '../../endpoint/endpoint';
import { SparqlNotebookCellStatusBarItemProvider } from '../../notebook/SparqlNotebookCellStatusBarItemProvider';
import { SparqlQuery } from '../../endpoint/model/sparql-query';
import { EndpointConnectionTreeDataProvider } from '../../sparql-connection-menu/endpoint-tree-data-provider.class';
import { EndpointConnectionListItem } from '../../sparql-connection-menu/endpoint-connection-list-item.class';
import { EndpointConfigurationV1 } from '../../model/endpoint-configuration-v1';
import { endpointFactory } from '../../endpoint/endpoint-factory';


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
        console.log('connectToEndpoint called with item:', item);
        let selectedId = item?.config.id;

        if (selectedId === undefined) {
            // no item selected, show quick pick
            const connections = context.globalState.get<EndpointConfigurationV1[]>(storageKey, []);
            const quickPickItems = connections.map(({ id, name }) => ({
                label: name,
                description: id,
                id,
            }));

            const picked = await window.showQuickPick(quickPickItems, {
                ignoreFocusOut: true,
                placeHolder: 'Select a SPARQL endpoint connection',
            });

            if (!picked) {
                window.showErrorMessage(`No endpoint connection selected.`);
                return;
            }
            selectedId = picked.id;
        }

        // find the connection configuration
        const endpointConfiguration = context.globalState.get<EndpointConfigurationV1[]>(storageKey, []).find(connection => connection.id === selectedId);


        if (endpointConfiguration === undefined) {
            // connection not found
            window.showErrorMessage(
                `"${selectedId}" not found. Please add the connection config in the sidebar before connecting.`
            );
            return;
        }



        const readEndpoint = await endpointFactory.createReadOnlyEndpoint(endpointConfiguration, context);

        if (readEndpoint === null) {
            notebookEndpoint.endpoint = null;
            connectionsSidepanel.setActive(null);
        } else {
            const testedHttpEndpoint = await testConnectionWithConfiguration(readEndpoint, endpointConfiguration);
            if (testedHttpEndpoint) {
                notebookEndpoint.endpoint = testedHttpEndpoint;
                connectionsSidepanel.setActive(endpointConfiguration.id);
                notebookEndpoint.updateEndpoint = await endpointFactory.createUpdateEndpoint(endpointConfiguration, context);
                window.showInformationMessage(`Successfully connected to "${endpointConfiguration.name}"`);
            }
        }
        // update the status bar of all SPARQL notebook cells
        sparqlNotebookCellStatusBarItemProvider.updateCellStatusBarItems();
    };
}


async function testConnectionWithConfiguration(endpoint: HttpEndpoint, config: EndpointConfigurationV1): Promise<HttpEndpoint | null> {
    try {
        const result = await endpoint.query(new SparqlQuery("SELECT * WHERE {?s ?p ?o.} LIMIT 1"));
        if (!result || result.status !== 200) {
            window.showErrorMessage(
                `Failed to connect to "${config.endpointURL}". HTTP status: ${result?.status} ${result?.statusText ?? ''} ${result.data ?? ''}`
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
