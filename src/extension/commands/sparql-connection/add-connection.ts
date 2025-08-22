import * as vscode from "vscode";

import { extensionId, storageKey } from "../../extension";
import { EndpointConnectionTreeDataProvider } from "../../sparql-connection-menu/endpoint-tree-data-provider.class";
import { EndpointConfiguration } from "../../model/endpoint-configuration";

/**
 * Create a new SPARQL endpoint connection.
 * 
 * @param context 
 * @param connectionsSidepanel 
 * @returns a function that adds a new connection
 */
export function addConnection(
    context: vscode.ExtensionContext,
    connectionsSidepanel: EndpointConnectionTreeDataProvider
) {
    return async () => {
        const displayNameInput = await getUserInput("Database Display Name ", true);
        const displayName = displayNameInput?.trim();
        if (!displayName) {
            vscode.window.showErrorMessage(`A valid display name is required.`);
            return;
        }
        const endpointURLInput = await getUserInput("Endpoint URL", true);
        const endpointURL = endpointURLInput?.trim();
        if (!endpointURL) {
            vscode.window.showErrorMessage(`A valid endpoint URL is required.`);
            return;
        }

        const userInput = await getUserInput("User", false);
        const user = userInput?.trim();

        const password = await getUserInput("Password", false, {
            password: true,
        });

        // create a key for the password
        const passwordKey = `${extensionId}.${displayName}`;

        // store the password in the secret store
        await context.secrets.store(passwordKey, password || "");

        // create the connection configuration
        const config: EndpointConfiguration = {
            name: displayName,
            endpointURL: endpointURL || "",
            user: user ?? "",
            passwordKey,
        };

        // get existing connections
        const existing = context.globalState
            .get<EndpointConfiguration[]>(storageKey, [])
            .filter(({ name }) => name !== displayName);
        existing.push(config);

        // update global state
        context.globalState.update(storageKey, existing);

        // refresh connections sidepanel
        connectionsSidepanel.refresh();
    };

}


async function getUserInput(name: string, required: boolean, options?: vscode.InputBoxOptions) {
    const value = await vscode.window.showInputBox({
        title: name,
        validateInput: required ? requiredValidator(name) : undefined,
        ignoreFocusOut: true,
        ...options,
    });
    return value;
};


const requiredValidator = (name: string) => (value: string) => {
    if (!value) {
        return `${name} is required`;
    }
    return undefined;
};
