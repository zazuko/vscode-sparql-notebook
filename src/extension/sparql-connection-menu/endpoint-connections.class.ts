import * as vscode from "vscode";
import { storageKey } from "../extension";

import { EndpointConfiguration } from "./endpoint-configuration.model";
import { EndpointConnectionListItem } from "./endpoint-connection-list-item.class";

export class EndpointConnections
  implements vscode.TreeDataProvider<EndpointConnectionListItem | vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    EndpointConnectionListItem | undefined | void
  > = new vscode.EventEmitter<EndpointConnectionListItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    EndpointConnectionListItem | undefined | void
  > = this._onDidChangeTreeData.event;

  constructor(public readonly context: vscode.ExtensionContext) {
    this.refresh();
    this.activeConn = null;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: EndpointConnectionListItem): vscode.TreeItem {
    return element;
  }

  public setActive(connName: string | null) {
    this.activeConn = connName;
    this.refresh();
  }
  private activeConn: string | null;

  getChildren(element?: EndpointConnectionListItem): Thenable<vscode.TreeItem[]> {
    if (element) {
      return Promise.resolve([
        new vscode.TreeItem(
          `EndPointURL: ${element.config.endpointURL}`,
          vscode.TreeItemCollapsibleState.None
        ),
        new vscode.TreeItem(
          `User: ${element.config.user}`,
          vscode.TreeItemCollapsibleState.None
        ),
      ]);
    }
    const connections =
      this.context.globalState.get<EndpointConfiguration[] | null>(storageKey) ?? [];

    return Promise.resolve(
      connections.map(
        (config) =>
          new EndpointConnectionListItem(
            config,
            config.name === this.activeConn,
            vscode.TreeItemCollapsibleState.Collapsed
          )
      )
    );
  }
}