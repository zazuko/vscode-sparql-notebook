import { ExtensionContext, window } from 'vscode';
import { EndpointConfigurationV1 } from "../model/endpoint-configuration-v1";
import { HttpEndpoint } from "./http-endpoint/http-endpoint";
import { extensionId } from '../extension';

class EndpointFactory {
    async createReadOnlyEndpoint(configuration: EndpointConfigurationV1, context: ExtensionContext): Promise<HttpEndpoint | null> {
        if (!configuration.endpointURL) {
            return null;
        }
        // get the password from the secret store
        const passwordFromStore = configuration.passwordKey ? await context.secrets.get(configuration.passwordKey) : undefined;
        const password = passwordFromStore ?? '';
        return new HttpEndpoint(configuration.endpointURL, configuration.user ?? '', password);
    }

    async createUpdateEndpoint(configuration: EndpointConfigurationV1, context: ExtensionContext): Promise<HttpEndpoint | null> {
        if (!configuration.updateEndpointURL) {
            return null;
        }
        if (configuration.isQLever) {
            // get the password from the secret store
            const passwordKey = `${extensionId}.${configuration.id}.qleverUpdateToken`
            const qleverAccessTokenFromStore = await context.secrets.get(passwordKey);
            const accessToken = qleverAccessTokenFromStore ?? '';
            return new HttpEndpoint(configuration.updateEndpointURL, configuration.user ?? '', accessToken, true);
        }
        // get the password from the secret store
        const passwordFromStore = configuration.passwordKey ? await context.secrets.get(configuration.passwordKey) : undefined;
        const password = passwordFromStore ?? '';
        return new HttpEndpoint(configuration.updateEndpointURL, configuration.user ?? '', password);
    }

}

export const endpointFactory = new EndpointFactory();

