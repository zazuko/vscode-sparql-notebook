
import { EventEmitter, TreeItem, TreeDataProvider, TreeItemCollapsibleState } from "vscode";
import type { EndpointConfigurationV1 } from "../model/endpoint-configuration-v1";
import { EndpointConnectionListItem } from "./endpoint-connection-list-item.class";
import { connectionManager } from "../extension";

export class EndpointConnectionTreeDataProvider implements TreeDataProvider<EndpointConnectionListItem | TreeItem> {

  #onDidChangeTreeData = new EventEmitter<void>();

  readonly onDidChangeTreeData = this.#onDidChangeTreeData.event;

  #activeConn: string | null = null;

  constructor() {
    this.refresh();
    this.#activeConn = null;
  }

  refresh(): void {
    this.#onDidChangeTreeData.fire();
  }

  getTreeItem(element: EndpointConnectionListItem): TreeItem {
    return element;
  }

  setActive(connName: string | null) {
    this.#activeConn = connName;
    this.refresh();
  }

  getActiveConnection(): EndpointConfigurationV1 | null {
    const connections = connectionManager.getConnections();

    if (!this.#activeConn) {
      return null;
    }

    return connections.find((c: EndpointConfigurationV1) => c.id === this.#activeConn) ?? null;
  }

  getChildren(_element?: EndpointConnectionListItem): Thenable<TreeItem[]> {
    const connections = connectionManager.getConnections();

    return Promise.resolve(
      connections.map((config) => new EndpointConnectionListItem(config, config.id === this.#activeConn, TreeItemCollapsibleState.None))
    );
  }
}