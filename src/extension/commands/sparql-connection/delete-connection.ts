import * as vscode from "vscode";

import { storageKey } from "../../extension";
import { EndpointConnectionTreeDataProvider } from "../../sparql-connection-menu/endpoint-tree-data-provider.class";
import { EndpointConnectionListItem } from "../../sparql-connection-menu/endpoint-connection-list-item.class";
import { EndpointConfigurationV1 } from "../../model/endpoint-configuration-v1";

export function deleteConnection(context: vscode.ExtensionContext, connectionsSidepanel: EndpointConnectionTreeDataProvider) {
    return async (item: EndpointConnectionListItem) => {
        const endpointConfigurationList = context.globalState.get<EndpointConfigurationV1[]>(storageKey, []);

        // remove item from list
        const listWithoutItem = endpointConfigurationList.filter(({ id }) => id !== item.config.id);

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