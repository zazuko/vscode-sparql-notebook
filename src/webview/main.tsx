import * as React from 'react';
import { render } from 'react-dom';

import { NewConnectionForm } from './components/new-connection-form/new-connection-form';

export const vscode = acquireVsCodeApi();

function createConnection(config: any) {
  vscode.postMessage({ type: 'create_connection', data: config });
}

function handleSubmit(form: HTMLFormElement) {
  // @ts-ignore
  const data = Object.fromEntries(new FormData(form));

  // now for some data cleanup
  if (data.encrypt) {
    // if "on", we want `true`, if nullish, we want false
    data.encrypt = !!data.encrypt;
  }
  if (data.trustServerCertificate) {
    // if "on", we want `true`, if nullish, we want false
    data.trustServerCertificate = !!data.trustServerCertificate;
  }

  createConnection(data);
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  render(<NewConnectionForm handleSubmit={handleSubmit} />, root);
});
