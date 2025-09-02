import {
    TreeItem,
    TreeItemCollapsibleState,
    Command,
    Uri
} from "vscode";


import { EndpointConfigurationV1 } from "../model/endpoint-configuration-v1";

export class EndpointConnectionListItem extends TreeItem {
    readonly config: EndpointConfigurationV1;
    readonly isActive: boolean;
    override readonly collapsibleState: TreeItemCollapsibleState;
    readonly assetsBaseUri: Uri;
    override readonly command?: Command;

    constructor(
        config: EndpointConfigurationV1,
        isActive: boolean,
        collapsibleState: TreeItemCollapsibleState,
        assetsBaseUri: Uri,
        command?: Command
    ) {
        super(config.name, collapsibleState);
        this.config = config;
        this.isActive = isActive;
        this.collapsibleState = collapsibleState;
        this.assetsBaseUri = assetsBaseUri;
        this.command = command;
        if (isActive) {
            this.iconPath = {
                dark: Uri.joinPath(assetsBaseUri, "dark", "endpoint-connected.svg"),
                light: Uri.joinPath(assetsBaseUri, "light", "endpoint-connected.svg"),
            };
            this.description = "Connected";
        } else {
            this.iconPath = {
                dark: Uri.joinPath(assetsBaseUri, "dark", "endpoint.svg"),
                light: Uri.joinPath(assetsBaseUri, "light", "endpoint.svg"),
            };
            this.description = "Inactive";
        }
        this.contextValue = "database";
    }
}



