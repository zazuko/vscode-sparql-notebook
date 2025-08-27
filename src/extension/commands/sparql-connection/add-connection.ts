import * as vscode from "vscode";

import { extensionId } from "../../extension";
import { EndpointConnectionTreeDataProvider } from "../../sparql-connection-menu/endpoint-tree-data-provider.class";
import { EndpointConfigurationV1 } from "../../model/endpoint-configuration-v1";
import { randomUUID } from "crypto";

/**
 * Create a new SPARQL endpoint connection.
 * 
 * @param context 
 * @param connectionsSidepanel 
 * @returns a function that adds a new connection
 */

/**
 * Refactored: Create a new partial connection and send it to the endpoint editor webview.
 *
 * @param context
 * @param connectionsSidepanel
 * @param getEndpointEditorPanel - function to get or create the endpointEditorPanel
 */
export function addConnection(
    context: vscode.ExtensionContext,
    connectionsSidepanel: EndpointConnectionTreeDataProvider,
    getEndpointEditorPanel: () => vscode.WebviewPanel | undefined
) {
    return async () => {
        // 1. Create a new partial connection
        const newConnection: Partial<EndpointConfigurationV1> = {
            id: randomUUID(),
            configVersion: 1,
            name: "New Connection"
        };

        // 2. Open or reveal the endpoint editor panel
        let panel = getEndpointEditorPanel();
        if (!panel) {
            await vscode.commands.executeCommand(`${extensionId}.showEndpointEditor`);
            // Wait a tick for the panel to be created
            setTimeout(() => {
                panel = getEndpointEditorPanel();
                if (panel) {
                    panel.reveal(vscode.ViewColumn.One);
                    // 3. Send the new connection to the webview
                    panel.webview.postMessage({ type: 'new-connection', data: newConnection });
                }
            }, 100);
        } else {
            panel.reveal(vscode.ViewColumn.One);
            panel.webview.postMessage({ type: 'new-connection', data: newConnection });
        }
    };
}


