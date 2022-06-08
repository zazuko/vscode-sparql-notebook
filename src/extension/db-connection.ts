import * as vscode from "vscode";
import * as path from "path";
import { storageKey } from "./extension";

export class SparqlNotebookConnections
  implements vscode.TreeDataProvider<ConnectionListItem | vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ConnectionListItem | undefined | void
  > = new vscode.EventEmitter<ConnectionListItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    ConnectionListItem | undefined | void
  > = this._onDidChangeTreeData.event;

  constructor(public readonly context: vscode.ExtensionContext) {
    this.refresh();
    this.activeConn = null;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ConnectionListItem): vscode.TreeItem {
    return element;
  }

  public setActive(connName: string | null) {
    this.activeConn = connName;
    this.refresh();
  }
  private activeConn: string | null;

  getChildren(element?: ConnectionListItem): Thenable<vscode.TreeItem[]> {
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
      this.context.globalState.get<ConnectionData[] | null>(storageKey) ?? [];

    return Promise.resolve(
      connections.map(
        (config) =>
          new ConnectionListItem(
            config,
            config.name === this.activeConn,
            vscode.TreeItemCollapsibleState.Expanded
          )
      )
    );
  }
}

export interface ConnectionData {
  name: string;
  endpointURL: string;
  user: string;
  passwordKey: string;
}

export class ConnectionListItem extends vscode.TreeItem {
  constructor(
    public readonly config: ConnectionData,
    public readonly isActive: boolean,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(config.name, collapsibleState);

    if (isActive) {
      this.iconPath = {
        dark: path.join(assetsPath, "dark", "dbconnection.svg"),
        light: path.join(assetsPath, "light", "dbconnection.svg"),
      };
      this.description = "Connected";
    } else {
      this.iconPath = {
        dark: path.join(assetsPath, "dark", "database.svg"),
        light: path.join(assetsPath, "light", "database.svg"),
      };
      this.description = "Inactive";
    }
    this.contextValue = "database";
  }
}

export const assetsPath = path.join(__filename, "..", "..", "..", "assets");
