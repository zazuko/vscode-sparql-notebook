import {
    WebviewPanel,
    ExtensionContext,
    ViewColumn,
    window,
    Uri,
    TreeItemCollapsibleState
} from "vscode";



import { EndpointConnectionTreeDataProvider } from "../../sparql-connection-menu/endpoint-tree-data-provider.class";
import { SparqlNotebookCellStatusBarItemProvider } from "../../notebook/SparqlNotebookCellStatusBarItemProvider";
import { EndpointConnectionListItem } from "../../sparql-connection-menu/endpoint-connection-list-item.class";
import { EndpointConfigurationV1, EndpointConfigurationV1WithPassword } from "../../model/endpoint-configuration-v1";
import { connectionManager } from "../../extension";
import { connectToEndpoint } from "../../commands/sparql-connection/connect-to-endpoint";

export class EndpointEditorPanel {
    #panel: WebviewPanel | undefined;
    #context: ExtensionContext;
    #connectionsSidepanel: EndpointConnectionTreeDataProvider;
    #sparqlNotebookCellStatusBarItemProvider: SparqlNotebookCellStatusBarItemProvider;

    constructor(
        context: ExtensionContext,
        connectionsSidepanel: EndpointConnectionTreeDataProvider,
        sparqlNotebookCellStatusBarItemProvider: SparqlNotebookCellStatusBarItemProvider,
    ) {
        this.#context = context;
        this.#connectionsSidepanel = connectionsSidepanel;
        this.#sparqlNotebookCellStatusBarItemProvider = sparqlNotebookCellStatusBarItemProvider;
    }

    /**
     * Show the endpoint editor panel.
     * 
     * @returns void
     */
    public showPanel() {
        if (this.#panel) {
            this.#panel.reveal(ViewColumn.One);
            console.log('Revealed existing endpoint editor panel');
            return;
        }
        this.#panel = window.createWebviewPanel(
            'endpointEditor',
            'Endpoint Editor',
            ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [Uri.file(EndpointEditorPanel.joinPath(this.#context.extensionPath, 'out', 'webview', 'endpoint-view', 'browser'))]
            }
        );
        this.#panel.webview.html = this.#getWebviewContent(this.#panel, this.#context.extensionPath);



        this.#panel.onDidDispose(() => {
            this.#panel = undefined;
        }, null, this.#context.subscriptions);

        // Register the webview message handler here so it is always attached to the correct panel
        this.#panel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'update-connection') {
                const updatedConfigPartial = message.data as Partial<EndpointConfigurationV1WithPassword>;
                const updatedConfig = await connectionManager.update(updatedConfigPartial);
                this.#connectionsSidepanel.refresh();

                // inform the webview about the active connection change
                this.#panel?.webview.postMessage({ type: 'active-connection', data: updatedConfig });

                // connect to the updated endpoint
                const item = new EndpointConnectionListItem(updatedConfig, true, TreeItemCollapsibleState.None);
                connectToEndpoint(this.#context, this.#connectionsSidepanel, this.#sparqlNotebookCellStatusBarItemProvider)(item);
            }
        });
    }

    /**
     * Edit an existing endpoint connection.
     * 
     * @param config The updated connection configuration.
     */
    public editConnection(config: Partial<EndpointConfigurationV1>) {
        this.#panel?.webview.postMessage({ type: 'active-connection', data: config });
    }

    // Utility to get webview HTML for Angular app
    #getWebviewContent(panel: WebviewPanel, extensionPath: string) {
        // Build URIs for Angular assets
        const appDistUri = Uri.joinPath(
            panel.webview.asWebviewUri(this.#context.extensionUri),
            'out/webview/endpoint-view/browser'
        );
        const mainJsUri = panel.webview.asWebviewUri(Uri.joinPath(
            this.#context.extensionUri,
            'out/webview/endpoint-view/browser/main.js'
        ));
        const stylesUri = panel.webview.asWebviewUri(Uri.joinPath(
            this.#context.extensionUri,
            'out/webview/endpoint-view/browser/styles.css'
        ));

        return /* html */ `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource} 'unsafe-inline'; script-src ${panel.webview.cspSource};">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="${stylesUri}">
                <title>SPARQL Notebook Endpoint Editor</title>
            </head>
            <body>
                <app-root></app-root>
                <script src="${mainJsUri}"></script>
            </body>
            </html>
        `;
    }

    // Browser-compatible path join utility
    private static joinPath(...parts: string[]): string {
        return parts.join("/").replace(/\/+/g, "/");
    }

}
