import * as vscode from "vscode";
import {
  EndpointConfiguration,
  EndpointConnectionListItem,
  EndpointConnections,
} from "./sparql-connection-menu";

import { SparqlClient } from "./simple-client";

import { storageKey, globalConnection } from "./extension";

export const deleteConnectionConfiguration =
  (
    context: vscode.ExtensionContext,
    connectionsSidepanel: EndpointConnections
  ) =>
    async (item: EndpointConnectionListItem) => {
      const without = context.globalState
        .get<EndpointConfiguration[]>(storageKey, [])
        .filter(({ name }) => name !== item.config.name);
      context.globalState.update(storageKey, without);
      await context.secrets.delete(item.config.name);

      connectionsSidepanel.refresh();
      vscode.window.showInformationMessage(
        `Successfully deleted connection configuration "${item.config.name}"`
      );
      connectionsSidepanel.refresh();
    };

export const addNewConnectionConfiguration =
  (
    context: vscode.ExtensionContext,
    connectionsSidepanel: EndpointConnections
  ) =>
    async () => {
      const displayName = await getUserInput("Database Display Name ", true);
      if (!displayName) {
        vscode.window.showErrorMessage(`A valid display name is required.`);
        return;
      }
      const endpointURL = await getUserInput("Endpoint URL", true);
      if (!endpointURL) {
        vscode.window.showErrorMessage(`A valid endpoint URL is required.`);
        return;
      }

      const user = await getUserInput("User", false);
      const password = await getUserInput("Password", false, {
        password: true,
      });
      const passwordKey = `sparql-notebook.${displayName}`;
      await context.secrets.store(passwordKey, password || "");
      const config: EndpointConfiguration = {
        name: displayName,
        endpointURL: endpointURL || "",
        user: user ?? "",
        passwordKey,
      };
      const existing = context.globalState
        .get<EndpointConfiguration[]>(storageKey, [])
        .filter(({ name }) => name !== displayName);
      existing.push(config);
      context.globalState.update(storageKey, existing);
      connectionsSidepanel.refresh();
    };

export const connectToDatabase =
  (
    context: vscode.ExtensionContext,
    connectionsSidepanel: EndpointConnections
  ) =>
    async (item?: EndpointConnectionListItem) => {
      let selectedName: string;
      if (!item) {
        const names = context.globalState
          .get(storageKey, [])
          .map(({ name }) => name);
        const namePicked = await vscode.window.showQuickPick(names, {
          ignoreFocusOut: true,
        });
        if (!namePicked) {
          vscode.window.showErrorMessage(`Invalid database connection name.`);
          return;
        }
        selectedName = namePicked;
      } else {
        selectedName = item.config.name;
      }
      const match = context.globalState
        .get<EndpointConfiguration[]>(storageKey, [])
        .find(({ name }) => name === selectedName);
      if (!match) {
        vscode.window.showErrorMessage(
          `"${selectedName}" not found. Please add the connection config in the sidebar before connecting.`
        );
        return;
      }
      const password = await context.secrets.get(match.passwordKey);
      if (password === undefined) {
        vscode.window.showErrorMessage(
          `Connection password not found in secret store.`
        );
        return;
      }
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
        const client = new SparqlClient(c.endpointURL, c.user, c.passwordKey);

        const result = await client.query("SELECT * WHERE {?s ?p ?o.} LIMIT 1");
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

const getUserInput = async (
  name: string,
  required: boolean,
  options?: vscode.InputBoxOptions
) => {
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
