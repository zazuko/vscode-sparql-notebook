import {
    TreeItem,
    TreeItemCollapsibleState,
    Command,
    Uri
} from "vscode";

import { EndpointConfigurationV1 } from "../model/endpoint-configuration-v1";

export class EndpointConnectionListItem extends TreeItem {
    constructor(
        public readonly config: EndpointConfigurationV1,
        public readonly isActive: boolean,
        public override readonly collapsibleState: TreeItemCollapsibleState,
        public override readonly command?: Command
    ) {
        super(config.name, collapsibleState);

        function joinAssetPath(...parts: string[]): string {
            return parts.join("/").replace(/\/+/g, "/");
        }
        if (isActive) {
            this.iconPath = {
                dark: Uri.file(joinAssetPath(assetsPath, "dark", "endpoint-connected.svg")),
                light: Uri.file(joinAssetPath(assetsPath, "light", "endpoint-connected.svg")),
            };
            this.description = "Connected";
        } else {
            this.iconPath = {
                dark: Uri.file(joinAssetPath(assetsPath, "dark", "endpoint.svg")),
                light: Uri.file(joinAssetPath(assetsPath, "light", "endpoint.svg")),
            };
            this.description = "Inactive";
        }
        this.contextValue = "database";
    }
}

// __filename is an absolute path, so we can use string ops to get the assets folder
function getAssetsPath(filename: string): string {
    // Remove file name, go up two directories, then add /assets
    const parts = filename.split("/");
    parts.pop(); // remove file name
    parts.pop(); // up one
    parts.pop(); // up two
    return parts.join("/") + "/assets";
}
export const assetsPath = getAssetsPath(__filename);
