import { ExtensionContext } from "vscode";
import { extensionId, storageKey } from "../extension";
import { EndpointConfigurationV1, EndpointConfigurationV1WithPassword, migrateEndpointConfigurationsToV1 } from "../model/endpoint-configuration-v1";
import { EndpointConfiguration } from "../model/endpoint-configuration";


class ConnectionConfigurationManager {
    #extensionContext: ExtensionContext | undefined = undefined;


    async initialize(context: ExtensionContext): Promise<void> {
        if (this.#extensionContext) {
            throw new Error("Extension context has already been set.");
        }
        this.#extensionContext = context;
        await this.#migrateOldConfigurations(context);
    }

    async #migrateOldConfigurations(context: ExtensionContext): Promise<void> {
        const configs = context.globalState.get<(EndpointConfiguration | EndpointConfigurationV1)[]>(storageKey, []);
        const oldConfigs = configs.filter(cfg => (cfg as EndpointConfigurationV1).configVersion === undefined);
        const newConfigs = configs.filter(cfg => (cfg as EndpointConfigurationV1).configVersion === 1);

        if (oldConfigs.length) {
            const migratedConfigs = await migrateEndpointConfigurationsToV1(oldConfigs, context);
            context.globalState.update(storageKey, [...migratedConfigs, ...newConfigs]);
        }
    }

    getConnections(): EndpointConfigurationV1[] {
        if (!this.#extensionContext) {
            throw new Error("ConnectionConfigurationManager is not initialized.");
        }
        return this.#extensionContext.globalState.get<EndpointConfigurationV1[]>(storageKey, []);
    }

    async update(updatedConfig: Partial<EndpointConfigurationV1WithPassword>): Promise<EndpointConfigurationV1> {
        if (!this.#extensionContext) {
            throw new Error("ConnectionConfigurationManager is not initialized.");
        }
        if (!updatedConfig.id) {
            throw new Error("New configuration must have an id.");
        }

        const context = this.#extensionContext;

        const configs = this.getConnections();

        // Find and update the matching config (by id)
        let indexOfUpdatedConfig = configs.findIndex(cfg => cfg.id === updatedConfig.id);

        if (indexOfUpdatedConfig === -1) {
            // this is a new connection -> add it
            configs.push(updatedConfig as EndpointConfigurationV1);
            indexOfUpdatedConfig = configs.length - 1;
        }

        const didPasswordChange = 'password' in updatedConfig;
        const didUpdatePasswordChange = 'updatePassword' in updatedConfig;
        const didQleverUpdateTokenChange = 'qleverUpdateToken' in updatedConfig;
        configs[indexOfUpdatedConfig] = { ...configs[indexOfUpdatedConfig], ...updatedConfig };

        if (didPasswordChange) {
            const password = updatedConfig.password;
            const passwordKey = `${extensionId}.${updatedConfig.id}`;

            if (updatedConfig.id && password !== undefined) {
                await context.secrets.store(passwordKey, password);
            }
            // remove the password from updatedConfig because it's stored in the secret store
            delete (configs[indexOfUpdatedConfig] as Partial<EndpointConfigurationV1WithPassword>).password;
            configs[indexOfUpdatedConfig].passwordKey = passwordKey;
            console.log('Password updated in secret store');
            console.log('Updated config after password change:', updatedConfig);
        }

        if (didUpdatePasswordChange) {
            const updatePassword = updatedConfig.updatePassword;
            const updatePasswordKey = `${extensionId}.${updatedConfig.id}.updatePassword`;
            if (updatedConfig.id && updatePassword !== undefined) {
                await context.secrets.store(updatePasswordKey, updatePassword);
            }
            // remove the updatePassword from updatedConfig because it's stored in the secret store
            delete (configs[indexOfUpdatedConfig] as Partial<EndpointConfigurationV1WithPassword>).updatePassword;
        }

        if (didQleverUpdateTokenChange) {
            const qleverUpdateToken = updatedConfig.qleverUpdateToken;
            const qleverUpdateTokenKey = `${extensionId}.${updatedConfig.id}.qleverUpdateToken`;
            if (updatedConfig.id && qleverUpdateToken !== undefined) {
                await context.secrets.store(qleverUpdateTokenKey, qleverUpdateToken);
            }
            // remove the qleverUpdateToken from updatedConfig because it's stored in the secret store
            delete (configs[indexOfUpdatedConfig] as Partial<EndpointConfigurationV1WithPassword>).qleverUpdateToken;
        }

        // 3. Save back to storage
        await context.globalState.update(storageKey, configs);
        return configs[indexOfUpdatedConfig];
    }
}


export const connectionConfigurationManager = new ConnectionConfigurationManager();
