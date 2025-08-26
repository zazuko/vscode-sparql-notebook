import { Injectable, signal } from '@angular/core';
declare function acquireVsCodeApi(): { postMessage: (msg: any) => void };

@Injectable({
  providedIn: 'root'
})
export class Connection {
  #vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;

  #connection = signal<EndpointConfigurationV1 | null>({
    "name": "Mopo",
    "endpointURL": "https://stardog-test.cluster.ldbar.ch/mopo-app-20220302/query",
    "user": "zazu-agschwend1",
    "passwordKey": "sparql-notebook.Mopo",
    "configVersion": 1,
    "id": "aebdb6a6-6bf5-4c60-8231-121230e0c4c3"
  });
  connection = this.#connection.asReadonly();

  constructor() {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'active-connection') {
        this.#connection.set(event.data.data as EndpointConfigurationV1);
      }
    });
  }

  updateConnection(data: Partial<EndpointConfigurationV1WithPassword>) {
    // write this data back to vscode extension with an event
    if (this.#vscode) {
      this.#vscode.postMessage({ type: 'update-connection', data });
    } else {
      // fallback for non-webview environments (optional)
      console.warn('VS Code API not available. Message not sent.');
    }
  }

}

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
