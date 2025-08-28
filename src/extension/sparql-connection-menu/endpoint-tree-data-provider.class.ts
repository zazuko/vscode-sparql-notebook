
import * as vscode from "vscode";
import { storageKey } from "../extension";
import type { EndpointConfigurationV1 } from "../model/endpoint-configuration-v1";
import { EndpointConnectionListItem } from "./endpoint-connection-list-item.class";

export class EndpointConnectionTreeDataProvider implements vscode.TreeDataProvider<EndpointConnectionListItem | vscode.TreeItem> {
  #onDidChangeTreeData: vscode.EventEmitter<EndpointConnectionListItem | undefined | void> = new vscode.EventEmitter<EndpointConnectionListItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<EndpointConnectionListItem | undefined | void> = this.#onDidChangeTreeData.event;

  #activeConn: string | null = null;

  constructor(public readonly context: vscode.ExtensionContext) {
    this.refresh();
    this.#activeConn = null;
  }

  refresh(): void {
    this.#onDidChangeTreeData.fire();
  }

  getTreeItem(element: EndpointConnectionListItem): vscode.TreeItem {
    return element;
  }

  setActive(connName: string | null) {
    this.#activeConn = connName;
    this.refresh();
  }

  getActiveConnection(): EndpointConfigurationV1 | null {
    const connections = this.context.globalState.get<EndpointConfigurationV1[] | null>(storageKey) ?? [];
    if (!this.#activeConn) return null;
    return connections.find((c: EndpointConfigurationV1) => c.id === this.#activeConn) ?? null;
  }

  getChildren(_element?: EndpointConnectionListItem): Thenable<vscode.TreeItem[]> {
    const connections = this.context.globalState.get<EndpointConfigurationV1[] | null>(storageKey) ?? [];

    return Promise.resolve(
      connections.map((config) => new EndpointConnectionListItem(config, config.id === this.#activeConn, vscode.TreeItemCollapsibleState.None))
    );
  }
}