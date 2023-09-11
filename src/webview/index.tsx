import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConnectionForm } from './components/connection-form/connection-form';

export const vscode = acquireVsCodeApi();

function createConnection(config: any) {
  vscode.postMessage({ type: 'create_connection', data: config });
}

import './index.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ConnectionForm handleSubmit={handleSubmit} />
  </StrictMode>
);

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


