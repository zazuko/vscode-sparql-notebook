import {
    TreeItem,
    TreeItemCollapsibleState,
    Command,
    ThemeIcon
} from "vscode";



import { EndpointConfigurationV1 } from "../model/endpoint-configuration-v1";



export class EndpointConnectionListItem extends TreeItem {
    readonly config: EndpointConfigurationV1;
    readonly isActive: boolean;
    override readonly collapsibleState: TreeItemCollapsibleState;
    override readonly command?: Command;

    constructor(
        config: EndpointConfigurationV1,
        isActive: boolean,
        collapsibleState: TreeItemCollapsibleState,
        command?: Command
    ) {
        super(config.name, collapsibleState);
        this.config = config;
        this.isActive = isActive;
        this.collapsibleState = collapsibleState;
        this.command = command;
        if (isActive) {
            this.iconPath = new ThemeIcon("plug");
            this.description = "Connected";
        } else {
            this.iconPath = new ThemeIcon("circle-outline");
            this.description = "Inactive";
        }
        this.contextValue = "database";
    }
}