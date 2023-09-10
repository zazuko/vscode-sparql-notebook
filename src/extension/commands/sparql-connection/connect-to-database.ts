import * as vscode from "vscode";
import {
    EndpointConfiguration,
    EndpointConnectionListItem,
    EndpointConnections,
} from "../../sparql-connection-menu";

import { HttpEndpoint } from "../../endpoint";

import { storageKey, globalConnection } from "../../extension";


export const connectToDatabase =
    (
        context: vscode.ExtensionContext,
        connectionsSidepanel: EndpointConnections
    ) =>
        async (item?: EndpointConnectionListItem) => {
            let selectedName = item?.config.name;

            if (selectedName === undefined) {
                // no item selected, show quick pick
                const connectionNameList = context.globalState
                    .get(storageKey, [])
                    .map(({ name }) => name);

                const namePicked = await vscode.window.showQuickPick(connectionNameList, {
                    ignoreFocusOut: true,
                });

                if (namePicked === undefined) {
                    vscode.window.showErrorMessage(`Invalid database connection name.`);
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
                vscode.window.showErrorMessage(
                    `"${selectedName}" not found. Please add the connection config in the sidebar before connecting.`
                );
                return;
            }

            // get the password from the secret store
            const passwordFromStore = await context.secrets.get(match.passwordKey);
            const password = passwordFromStore ?? '';

            globalConnection.connection = {
                data: {
                    name: match.name,
                    endpointURL: match.endpointURL,
                    user: match.user,
                    passwordKey: password,
                },
            };
            try {
                const c = globalConnection.connection.data;
                const client = new HttpEndpoint(c.endpointURL, c.user, c.passwordKey);

                // test the connection
                await client.query("SELECT * WHERE {?s ?p ?o.} LIMIT 1");
                connectionsSidepanel.setActive(match.name);
                vscode.window.showInformationMessage(
                    `Successfully connected to "${match.name}"`
                );
            } catch (err: any) {
                console.log(err);
                vscode.window.showErrorMessage(
                    `Failed to connect to "${match.name}": ${err?.message}`
                );
                globalConnection.connection = null;
                connectionsSidepanel.setActive(null);
            }
        };

