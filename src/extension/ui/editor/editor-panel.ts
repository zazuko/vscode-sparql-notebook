import { WebviewPanel, ExtensionContext, ViewColumn, window, Uri, TreeItemCollapsibleState } from "vscode";

import * as path from "path";

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
                localResourceRoots: [Uri.file(path.join(this.#context.extensionPath, 'out', 'webview', 'endpoint-view', 'browser'))
                ]
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
        const appDistPath = Uri.file(
            path.join(extensionPath, 'out', 'webview', 'endpoint-view', 'browser')
        );
        const indexHtmlPath = path.join(appDistPath.fsPath, 'index.html');
        let indexHtml = '';
        try {
            indexHtml = require('fs').readFileSync(indexHtmlPath, 'utf8');
        } catch (e) {
            return `<html><body><h1>Could not load Angular app</h1><pre>${e}</pre></body></html>`;
        }
        // Rewrite local resource URLs to webview URIs
        indexHtml = indexHtml.replace(/src=\"(.+?)\"/g, (match, src) => {
            if (src.startsWith('http') || src.startsWith('data:')) return match;
            const resourceUri = panel.webview.asWebviewUri(Uri.file(path.join(appDistPath.fsPath, src)));
            return `src=\"${resourceUri}\"`;
        });
        indexHtml = indexHtml.replace(/href=\"(.+?)\"/g, (match, href) => {
            if (href.startsWith('http') || href.startsWith('data:') || href.startsWith('#')) return match;
            const resourceUri = panel.webview.asWebviewUri(Uri.file(path.join(appDistPath.fsPath, href)));
            return `href=\"${resourceUri}\"`;
        });
        return indexHtml;
    }

}
