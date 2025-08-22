import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Connection {
  #connection = signal<ConnectionData | null>({
    "name": "mopo",
    "endpointURL": "https://stardog-test.cluster.ldbar.ch/mopo-app-20220302",
    "user": "zazu-agschwend1",
    "passwordKey": "sparql-notebook.mopo"
  });
  connection = this.#connection.asReadonly();

  constructor() {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'active-connection') {
        this.#connection.set(event.data.data as ConnectionData);
      }
    });
  }

  updateConnection(data: Partial<ConnectionData>) {
    console.log('updateConnection', data);
    // this.#connection.update((prev) => ({ ...prev, ...data }));
  }
}

export interface ConnectionData {
  name: string;
  endpointURL: string;
  user: string;
  passwordKey: string;
}
