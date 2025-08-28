import * as vscode from "vscode";

import { SparqlNotebookController } from "./notebook/sparql-notebook-controller";
import { EndpointConnectionTreeDataProvider } from "./sparql-connection-menu/endpoint-tree-data-provider.class";

import { SparqlNotebookSerializer } from "./notebook/file-io";

import { deleteConnection } from "./commands/sparql-connection/delete-connection";
import { addConnection } from "./commands/sparql-connection/add-connection";
import { connectToEndpoint } from "./commands/sparql-connection/connect-to-endpoint";

import { exportToMarkdown } from "./commands/export/export-to-markdown";
import { addQueryFromFile } from "./commands/code-cell/add-query-from-file";

import { createStoreFromFile } from "./commands/store-from-file/store-from-file";
import { SparqlNotebookCellStatusBarItemProvider } from './notebook/SparqlNotebookCellStatusBarItemProvider';

import * as path from "path";
import { EndpointConnectionListItem } from "./sparql-connection-menu/endpoint-connection-list-item.class";
import { EndpointConfigurationV1, EndpointConfigurationV1WithPassword, migrateEndpointConfigurationsToV1, migratePassword } from './model/endpoint-configuration-v1';
import { EndpointConfiguration } from "./model/endpoint-configuration";

export const extensionId = "sparql-notebook";
export const storageKey = `${extensionId}-connections`;

/**
 * Activate the extension.
 * 
 * @param context activate the form provider
 */
export async function activate(context: vscode.ExtensionContext) {
  // Migrate endpoint configs at startup
  const configs = context.globalState.get<(EndpointConfiguration | EndpointConfigurationV1)[]>(storageKey, []);
  const oldConfigs = configs.filter(cfg => (cfg as EndpointConfigurationV1).configVersion === undefined);
  const newConfigs = configs.filter(cfg => (cfg as EndpointConfigurationV1).configVersion === 1);
  if (oldConfigs.length) {
    console.log(`Migrating ${oldConfigs.length} old endpoint configurations to v1...`);
    const migratedConfigs = await migrateEndpointConfigurationsToV1(oldConfigs, context);
    context.globalState.update(storageKey, [...migratedConfigs, ...newConfigs]);
  }

  // Register command to show the endpoint editor webview
  let endpointEditorPanel: vscode.WebviewPanel | undefined;

  // Getter for the current endpointEditorPanel
  function getEndpointEditorPanel() {
    return endpointEditorPanel;
  }
  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${extensionId}.showEndpointEditor`,
      () => {
        if (endpointEditorPanel) {
          endpointEditorPanel.reveal(vscode.ViewColumn.One);
          return;
        }
        endpointEditorPanel = vscode.window.createWebviewPanel(
          'endpointEditor',
          'Endpoint Editor',
          vscode.ViewColumn.One,
          {
            enableScripts: true,
            localResourceRoots: [
              vscode.Uri.file(path.join(context.extensionPath, 'out', 'webview', 'endpoint-view', 'browser'))
            ]
          }
        );
        endpointEditorPanel.webview.html = getWebviewContent(endpointEditorPanel, context.extensionPath);
        // Send the active connection to the webview after it loads
        const activeConn = connectionsSidepanel.getActiveConnection();
        if (activeConn) {
          setTimeout(() => {
            // reconnect to this new connection
            connectToEndpoint(context, connectionsSidepanel, sparqlNotebookCellStatusBarItemProvider)
            endpointEditorPanel?.webview.postMessage({ type: 'active-connection', data: activeConn });
          }, 500);
        }
        endpointEditorPanel.onDidDispose(() => {
          endpointEditorPanel = undefined;
        }, null, context.subscriptions);

        // Register the webview message handler here so it is always attached to the correct panel
        endpointEditorPanel.webview.onDidReceiveMessage(async (message) => {
          console.log('Webview message received:', message);
          if (message.type === 'update-connection') {
            const updatedConfig = message.data as Partial<EndpointConfigurationV1WithPassword>; // The updated config sent from the webview
            console.log('Received updated config from webview:', updatedConfig);

            // 1. Load all configs from storage
            const configs = context.globalState.get<EndpointConfigurationV1[]>(storageKey, []);

            // 2. Find and update the matching config (by id)
            let idx = configs.findIndex(cfg => cfg.id === updatedConfig.id);
            if (idx === -1) {
              console.log('No matching config found for update:, it is new connection');
              configs.push(updatedConfig as EndpointConfigurationV1);
              // set idx to the new config's index
              idx = configs.length - 1;
            }
            if (idx !== -1) {
              const didPasswordChange = 'password' in updatedConfig;
              const didUpdatePasswordChange = 'updatePassword' in updatedConfig;
              const didQleverUpdateTokenChange = 'qleverUpdateToken' in updatedConfig;
              configs[idx] = { ...configs[idx], ...updatedConfig };

              if (didPasswordChange) {
                const password = updatedConfig.password;
                const passwordKey = `${extensionId}.${updatedConfig.id}`;
                if (updatedConfig.id && password !== undefined) {
                  await context.secrets.store(passwordKey, password);
                }
                // remove the password from updatedConfig because it's stored in the secret store
                delete (configs[idx] as Partial<EndpointConfigurationV1WithPassword>).password;
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
                delete (configs[idx] as Partial<EndpointConfigurationV1WithPassword>).updatePassword;
              }
              if (didQleverUpdateTokenChange) {
                const qleverUpdateToken = updatedConfig.qleverUpdateToken;
                const qleverUpdateTokenKey = `${extensionId}.${updatedConfig.id}.qleverUpdateToken`;
                if (updatedConfig.id && qleverUpdateToken !== undefined) {
                  await context.secrets.store(qleverUpdateTokenKey, qleverUpdateToken);
                }
                // remove the qleverUpdateToken from updatedConfig because it's stored in the secret store
                delete (configs[idx] as Partial<EndpointConfigurationV1WithPassword>).qleverUpdateToken;
              }

              // 3. Save back to storage
              await context.globalState.update(storageKey, configs);
              // 4. Optionally, refresh your UI
              connectionsSidepanel.refresh();
              setTimeout(() => {
                // 1. Load all configs from storage
                const configs = context.globalState.get<EndpointConfigurationV1[]>(storageKey, []);

                // 2. Find and update the matching config (by id)
                const idx = configs.findIndex(cfg => cfg.id === updatedConfig.id);
                const activeConn = configs[idx];
                if (activeConn) {
                  connectionsSidepanel.setActive(activeConn.id)
                  const item = new EndpointConnectionListItem(activeConn, true, vscode.TreeItemCollapsibleState.None);

                  connectToEndpoint(context, connectionsSidepanel, sparqlNotebookCellStatusBarItemProvider)(item);
                  endpointEditorPanel?.webview.postMessage({ type: 'active-connection', data: activeConn });
                }
              }, 100);
            }
          }
        });
      }))








  // register the sparql notebook serializer
  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer(
      extensionId,
      new SparqlNotebookSerializer()
    )
  );

  // register the notebook controller
  const sparqlNotebookController = new SparqlNotebookController();
  context.subscriptions.push(sparqlNotebookController);

  // register the cell status bar item provider
  const sparqlNotebookCellStatusBarItemProvider = new SparqlNotebookCellStatusBarItemProvider();
  context.subscriptions.push(vscode.notebooks.registerNotebookCellStatusBarItemProvider(extensionId, sparqlNotebookCellStatusBarItemProvider));

  // register the connections sidepanel
  const connectionsSidepanel = new EndpointConnectionTreeDataProvider(context);
  vscode.window.registerTreeDataProvider(storageKey, connectionsSidepanel);

  vscode.commands.registerCommand(
    `${extensionId}.deleteConnectionConfiguration`,
    deleteConnection(context, connectionsSidepanel)
  );

  vscode.commands.registerCommand(
    `${extensionId}.addNewConnectionConfiguration`,
    addConnection(context, connectionsSidepanel, getEndpointEditorPanel)
  );
  vscode.commands.registerCommand(
    `${extensionId}.connect`,
    connectToEndpoint(context, connectionsSidepanel, sparqlNotebookCellStatusBarItemProvider)
  );

  // Assuming you have a TreeDataProvider called endpointTreeDataProvider
  const treeView = vscode.window.createTreeView('sparql-notebook-connections', {
    treeDataProvider: connectionsSidepanel
  });

  treeView.onDidChangeSelection(e => {
    const selected = e.selection[0] as EndpointConnectionListItem | undefined;
    if (selected) {
      // Ensure the endpointEditorPanel is shown before posting the message
      if (!endpointEditorPanel) {
        vscode.commands.executeCommand(`${extensionId}.showEndpointEditor`).then(() => {
          // Wait a tick for the panel to be created and shown
          setTimeout(() => {
            if (endpointEditorPanel) {
              endpointEditorPanel.reveal(vscode.ViewColumn.One);
              endpointEditorPanel.webview.postMessage({ type: 'active-connection', data: selected!.config });
            }
          }, 100);
        });
      } else {
        endpointEditorPanel.reveal(vscode.ViewColumn.One);
        endpointEditorPanel.webview.postMessage({ type: 'active-connection', data: selected!.config });
      }
    }
  });

  // create store from file
  vscode.commands.registerCommand(
    `${extensionId}.createStoreFromFile`,
    createStoreFromFile(sparqlNotebookCellStatusBarItemProvider)
  );

  //  export related commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${extensionId}.exportToMarkdown`,
      exportToMarkdown
    )
  );

  // code cell related commands
  vscode.commands.registerCommand(
    `${extensionId}.addQueryFromFile`,
    addQueryFromFile
  );


  // load external notebook files
  // Execute code after a notebook is loaded
  // Register the onDidChangeNotebookDocument event
  context.subscriptions.push(vscode.workspace.onDidOpenNotebookDocument(notebookDocument => {
    // Check if the notebook is a SPARQL Notebook
    if (notebookDocument.notebookType !== extensionId) {
      return;
    }
    // reload the cells with external query file content
    // this have to be done here because we work with relative query file path
    // and the notebook path is not available in the deserializer
    const notebookPath = notebookDocument.uri.fsPath;
    const notebookDirectory = path.dirname(notebookPath);

    // cells with a file metadata
    notebookDocument.getCells().filter(cell => cell.kind === vscode.NotebookCellKind.Code && cell.metadata.file).forEach(async cell => {
      const activeNotebook = cell.notebook;

      if (activeNotebook) {
        const sparqlFilePath = cell.metadata.file.replace(/\\/g, '/');

        try {
          let relativeSparqlFilePath = sparqlFilePath;
          if (path.isAbsolute(sparqlFilePath)) {
            relativeSparqlFilePath = path.relative(notebookDirectory, sparqlFilePath);
            console.log('rel path', path.relative(notebookPath, sparqlFilePath));
          }


          const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(path.join(notebookDirectory, relativeSparqlFilePath)));
          const newCell = new vscode.NotebookCellData(vscode.NotebookCellKind.Code, `# from file ${relativeSparqlFilePath}\n${(await fileContent).toString()}`, 'sparql');

          newCell.metadata = {
            file: relativeSparqlFilePath
          };
          // Logic to add the notebook cell using the fileContent
          const notebookEdit = vscode.NotebookEdit.replaceCells(new vscode.NotebookRange(cell.index, cell.index + 1), [newCell]);
          const edit = new vscode.WorkspaceEdit();
          edit.set(notebookDocument.uri, [notebookEdit]);
          vscode.workspace.applyEdit(edit);
        } catch (error) {
          // Handle file read error
          vscode.window.showErrorMessage(`Error reading file ${sparqlFilePath}: ${error}\n$Reset the file path for the cell. ${cell.index}`);
          console.error('Error reading file:', error);
        }
      }
    });
  }));

  context.subscriptions.push(vscode.workspace.onDidSaveNotebookDocument(notebookDocument => {
    // Check if the notebook is a SPARQL Notebook
    if (notebookDocument.notebookType !== extensionId) {
      return;
    }
    // write query files here 
    const notebookPath = notebookDocument.uri.fsPath;
    const notebookDirectory = path.dirname(notebookPath);

    // cells with a file metadata
    notebookDocument.getCells().filter(cell => cell.kind === vscode.NotebookCellKind.Code && cell.metadata.file).forEach(async cell => {
      const activeNotebook = cell.notebook;
      if (activeNotebook) {
        const sparqlFilePath = cell.metadata.file.replace(/\\/g, '/');
        try {
          let relativeSparqlFilePath = sparqlFilePath;
          if (path.isAbsolute(sparqlFilePath)) {
            relativeSparqlFilePath = path.relative(notebookDirectory, sparqlFilePath);
          }

          const sparqlQuery = cell.document.getText().replace(/^# from file.*[\r\n]/, '');
          const content = Buffer.from(sparqlQuery, 'utf-8');
          await vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(notebookDirectory, relativeSparqlFilePath)), content);


        } catch (error) {
          vscode.window.showErrorMessage(`Error writing file: ${sparqlFilePath}: ${error}`);
          console.error('Error writing file:', error);
        }

      }
    });
  }));

};

// this method is called when your extension is deactivated
export function deactivate() { }



// Utility to get webview HTML for Angular app
function getWebviewContent(panel: vscode.WebviewPanel, extensionPath: string) {
  const appDistPath = vscode.Uri.file(
    path.join(extensionPath, 'out', 'webview', 'endpoint-view', 'browser')
  );
  const indexHtmlPath = path.join(appDistPath.fsPath, 'index.html');
  let indexHtml = '';
  try {
    indexHtml = require('fs').readFileSync(indexHtmlPath, 'utf8');
  } catch (e) {
    return `<html><body><h1>Could not load Angular app</h1><pre>${e}</pre></body></html>`;
  }
  // Rewrite local resource URLs to webview URIs
  indexHtml = indexHtml.replace(/src=\"(.+?)\"/g, (match, src) => {
    if (src.startsWith('http') || src.startsWith('data:')) return match;
    const resourceUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(appDistPath.fsPath, src)));
    return `src=\"${resourceUri}\"`;
  });
  indexHtml = indexHtml.replace(/href=\"(.+?)\"/g, (match, href) => {
    if (href.startsWith('http') || href.startsWith('data:') || href.startsWith('#')) return match;
    const resourceUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(appDistPath.fsPath, href)));
    return `href=\"${resourceUri}\"`;
  });
  return indexHtml;
}


