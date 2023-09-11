import { ExtensionContext, window, WebviewViewProvider, WebviewView, Webview, Uri, commands, WebviewViewResolveContext, CancellationToken } from 'vscode';
import { extensionId } from '../extension';

/**
 * Activates the form provider for the extension.
 * @param context The extension context.
 */
export function activateFormProvider(context: ExtensionContext) {
    // Create a new instance of the SparqlConfigurationViewProvider class.
    const provider = new SparqlConfigurationViewProvider(
        `${extensionId}.connectionForm`, // The ID of the view.
        context // The extension context.
    );

    // Register the provider with the window.
    context.subscriptions.push(
        window.registerWebviewViewProvider(provider.viewId, provider)
    );
}

class SparqlConfigurationViewProvider implements WebviewViewProvider {
    public readonly viewId: string;
    private readonly context: ExtensionContext;

    constructor(viewId: string, context: ExtensionContext) {
        this.viewId = viewId;
        this.context = context;
    }

    async resolveWebviewView(
        webviewView: WebviewView,
        _context: WebviewViewResolveContext<unknown>,
        _token: CancellationToken
    ): Promise<void> {
        webviewView.webview.options = {
            enableScripts: true,
            enableForms: true,
            localResourceRoots: [this.context.extensionUri],
        };
        webviewView.webview.html = await getWebviewContent(
            webviewView.webview,
            this.context.extensionUri
        );
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'create_connection':
                    const { displayName, endpointUrl, username, password } = message.data;
                    const passwordKey = `${extensionId}.${displayName}`;

                    const newConfig = {
                        name: displayName,
                        passwordKey,
                        username: username
                    };

                    //  await this.context.secrets.store(passwordKey, password || '');

                    await commands.executeCommand(
                        `${extensionId}.refreshConnectionPanel`
                    );
                    webviewView.webview.postMessage({ type: 'clear_form' });
            }
        });
    }
}

/**
 * Generates the HTML content for the webview.
 * @param webview The webview instance.
 * @param extensionUri The URI of the extension.
 * @returns The HTML content for the webview.
 */
async function getWebviewContent(webview: Webview, extensionUri: Uri) {
    // Get the path to the extension's JavaScript bundle.
    const bundlePath = getUri(webview, extensionUri, [
        'out',
        'web',
        'extension.js',
    ]);

    // Set the Content-Security-Policy header to include the nonce value.
    const nonce = generateNonce();
    const cspSource = webview.cspSource;
    const csp = `default-src 'none'; img-src ${cspSource}; script-src 'nonce-${nonce}' ${cspSource}; style-src ${cspSource} 'unsafe-inline'; font-src ${cspSource};`;

    // Return the HTML content for the webview.
    return `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width,initial-scale=1.0">
                <title>SPARQL Notebook Connection</title>
                <meta http-equiv="Content-Security-Policy" content="${csp}">
            </head>
            <body>
                <div id="root"></div>
                <script nonce="${nonce}" src="${bundlePath}"></script>
            </body>
        </html>
    `;
}


function generateNonce(): string {
    const nonceChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += nonceChars.charAt(Math.floor(Math.random() * nonceChars.length));
    }
    return result;
}

function getUri(
    webview: Webview,
    extensionUri: Uri,
    pathList: string[]
) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}
