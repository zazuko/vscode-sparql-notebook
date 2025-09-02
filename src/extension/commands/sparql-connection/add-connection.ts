import { getUuid } from '../../utils/uuid';

import { EndpointConfigurationV1 } from "../../model/endpoint-configuration-v1";

import { EndpointEditorPanel } from "../../ui/editor/editor-panel";

/**
 * Create a new SPARQL endpoint connection.
 * 
 * @param context 
 * @param connectionsSidepanel 
 * @returns a function that adds a new connection
 */

/**
 * Refactored: Create a new partial connection and send it to the endpoint editor webview.
 *
 * @param context
 * @param connectionsSidepanel
 * @param getEndpointEditorPanel - function to get or create the endpointEditorPanel
 */
export function addConnection(
    endpointEditorPanel: EndpointEditorPanel
) {
    return async () => {
        // 1. Create a new partial connection
        const newConnection: Partial<EndpointConfigurationV1> = {
            id: getUuid(),
            configVersion: 1,
            name: "New Connection"
        };
        endpointEditorPanel.showPanel();
        endpointEditorPanel.editConnection(newConnection);
    };
}


