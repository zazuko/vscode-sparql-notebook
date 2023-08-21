import * as vscode from "vscode";
import {
    EndpointConfiguration,
    EndpointConnectionListItem,
    EndpointConnections,
} from "../../sparql-connection-menu";

import { storageKey } from "../../extension";

export const deleteConnection =
    (
        context: vscode.ExtensionContext,
        connectionsSidepanel: EndpointConnections
    ) =>
        async (item: EndpointConnectionListItem) => {
            const endpointConfigurationList = context.globalState
                .get<EndpointConfiguration[]>(storageKey, []);

            // remove item from list
            const listWithoutItem = endpointConfigurationList
                .filter(({ name }) => name !== item.config.name);

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

