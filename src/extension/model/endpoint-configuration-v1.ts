
import { randomUUID } from 'crypto';
import { EndpointConfiguration } from './endpoint-configuration';
import * as vscode from "vscode";
import { extensionId } from '../extension';

export interface EndpointConfigurationV1 {
    // Configuration schema version (required)
    configVersion: number;

    // Stable internal identifier (required)
    id: string;

    // Old fields for backward compatibility
    name: string;
    endpointURL: string;
    user?: string;
    passwordKey?: string;

    // New: optional update endpoint
    updateEndpointURL?: string;
    // New: optional authentication for update endpoint
    updateUser?: string;
    updatePasswordKey?: string;

    // QLever-specific: update token for QLever endpoints
    qleverUpdateToken?: string;
    isQLever?: boolean;
}


export interface EndpointConfigurationV1WithPassword extends EndpointConfigurationV1 {
    password: string;
    updatePassword?: string;
    qleverUpdateToken?: string;
}

export async function migrateEndpointConfigurationsToV1(configs: (EndpointConfiguration | EndpointConfigurationV1)[], context: vscode.ExtensionContext): Promise<EndpointConfigurationV1[]> {
    const migrated = configs.map(async cfg => {
        if ('configVersion' in cfg && cfg.configVersion >= 1) {
            return cfg;
        }
        // get the password from the secret store
        const uuid = randomUUID();
        const passwordKey = await migratePassword(uuid, cfg.passwordKey || `${extensionId}.${cfg.name}`, context);

        return {
            ...cfg,
            configVersion: 1,
            id: uuid,
            passwordKey
        } as EndpointConfigurationV1;
    });
    return Promise.all(migrated);
}


export async function migratePassword(uuid: string, oldPasswordKey: string, context: vscode.ExtensionContext): Promise<string> {
    // check if the old password key allready the uuid pattern
    if (oldPasswordKey === `${extensionId}.${uuid}`) {
        return oldPasswordKey;
    }
    const password = await context.secrets.get(oldPasswordKey);
    const passwordKey = `${extensionId}.${uuid}`;
    await context.secrets.store(passwordKey, password || "");
    return passwordKey;
}