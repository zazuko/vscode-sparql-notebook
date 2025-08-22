import * as vscode from "vscode";

import { storageKey } from "../../extension";
import { EndpointConnectionTreeDataProvider } from "../../sparql-connection-menu/endpoint-tree-data-provider.class";
import { EndpointConnectionListItem } from "../../sparql-connection-menu/endpoint-connection-list-item.class";
import { EndpointConfiguration } from "../../model/endpoint-configuration";

export function deleteConnection(context: vscode.ExtensionContext, connectionsSidepanel: EndpointConnectionTreeDataProvider) {
    return async (item: EndpointConnectionListItem) => {
        const endpointConfigurationList = context.globalState.get<EndpointConfiguration[]>(storageKey, []);

        // remove item from list
        const listWithoutItem = endpointConfigurationList.filter(({ name }) => name !== item.config.name);

        // update global state without item
        context.globalState.update(storageKey, listWithoutItem);

        // delete password from secrets
        await context.secrets.delete(item.config.name);

        // refresh connections sidepanel
        connectionsSidepanel.refresh();

        // show success message
        vscode.window.showInformationMessage(
            `Successfully deleted connection configuration "${item.config.name}"`
        );
    };

}