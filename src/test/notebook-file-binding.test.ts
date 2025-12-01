import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Notebook File Binding Test Suite', () => {
    let tmpDir: string;

    setup(async () => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-sparql-test-'));
    });

    teardown(async () => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('Updates cell content from bound file on open', async () => {
        const queryContent = 'SELECT * WHERE { ?s ?p ?o }';
        const queryFile = 'query.sparql';
        const notebookFile = 'test.sparqlbook';

        // Create the external query file
        fs.writeFileSync(path.join(tmpDir, queryFile), queryContent);

        // Create the notebook file with a cell bound to the query file
        const notebookContent = [
            {
                kind: vscode.NotebookCellKind.Code,
                language: 'sparql',
                value: 'OLD CONTENT',
                metadata: {
                    file: queryFile
                }
            }
        ];
        fs.writeFileSync(path.join(tmpDir, notebookFile), JSON.stringify(notebookContent));

        // Open the notebook
        const uri = vscode.Uri.file(path.join(tmpDir, notebookFile));
        const document = await vscode.workspace.openNotebookDocument(uri);
        await vscode.window.showNotebookDocument(document);

        // Wait for the extension to update the cell
        // We can't easily hook into the extension's internal events, so we poll for the change
        await new Promise<void>(resolve => {
            const disposable = vscode.workspace.onDidChangeNotebookDocument(e => {
                if (e.notebook.uri.toString() === uri.toString()) {
                    // Check if the cell content has been updated
                    const cell = e.notebook.cellAt(0);
                    if (cell.document.getText().includes(queryContent)) {
                        disposable.dispose();
                        resolve();
                    }
                }
            });

            // Also check immediately in case it happened before we subscribed
            if (document.cellAt(0).document.getText().includes(queryContent)) {
                disposable.dispose();
                resolve();
            }

            // Timeout fallback
            setTimeout(() => {
                disposable.dispose();
                resolve();
            }, 5000);
        });

        const cell = document.cellAt(0);
        assert.ok(cell.document.getText().includes(queryContent), `Cell content should include "${queryContent}", but was "${cell.document.getText()}"`);
        assert.ok(cell.document.getText().includes(`# from file ${queryFile}`), 'Cell content should include file comment');
    });

    test('Keeps stored content if bound file is missing', async () => {
        const notebookFile = 'missing.sparqlbook';
        const storedContent = 'STORED CONTENT';

        // Create the notebook file with a cell bound to a missing file
        const notebookContent = [
            {
                kind: vscode.NotebookCellKind.Code,
                language: 'sparql',
                value: storedContent,
                metadata: {
                    file: 'nonexistent.sparql'
                }
            }
        ];
        fs.writeFileSync(path.join(tmpDir, notebookFile), JSON.stringify(notebookContent));

        // Open the notebook
        const uri = vscode.Uri.file(path.join(tmpDir, notebookFile));
        const document = await vscode.workspace.openNotebookDocument(uri);
        await vscode.window.showNotebookDocument(document);

        // Wait a bit to ensure no update happens (or rather, that if it were to happen, it would have)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const cell = document.cellAt(0);
        assert.strictEqual(cell.document.getText(), storedContent, 'Cell content should remain as stored content');
    });

    test('Executes SPARQL query against file endpoint', async () => {
        const dataFile = 'data.ttl';
        const notebookFile = 'query.sparqlbook';

        // Create a Turtle file with sample RDF data
        const turtleData = `@prefix ex: <http://example.org/> .

ex:subject ex:predicate "test value" .
ex:subject ex:name "Test Subject" .
`;
        fs.writeFileSync(path.join(tmpDir, dataFile), turtleData);

        // Create the notebook file with a SPARQL query
        const queryContent = `# [endpoint=data.ttl]

SELECT ?s ?p ?o WHERE {
    ?s ?p ?o
}`;
        const notebookContent = [
            {
                kind: vscode.NotebookCellKind.Code,
                language: 'sparql',
                value: queryContent,
                metadata: {}
            }
        ];
        fs.writeFileSync(path.join(tmpDir, notebookFile), JSON.stringify(notebookContent));

        // Open the notebook
        const uri = vscode.Uri.file(path.join(tmpDir, notebookFile));
        const document = await vscode.workspace.openNotebookDocument(uri);
        await vscode.window.showNotebookDocument(document);

        // Execute the cell
        const cell = document.cellAt(0);
        await vscode.commands.executeCommand('notebook.cell.execute', { ranges: [{ start: 0, end: 1 }], document: uri });

        // Wait for execution to complete by monitoring cell outputs
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                disposable.dispose();
                reject(new Error('Cell execution timed out'));
            }, 10000);

            const disposable = vscode.workspace.onDidChangeNotebookDocument(e => {
                if (e.notebook.uri.toString() === uri.toString()) {
                    const cell = e.notebook.cellAt(0);
                    if (cell.outputs.length > 0) {
                        clearTimeout(timeout);
                        disposable.dispose();
                        resolve();
                    }
                }
            });

            // Check if output already exists
            if (cell.outputs.length > 0) {
                clearTimeout(timeout);
                disposable.dispose();
                resolve();
            }
        });

        // Verify the output
        assert.ok(cell.outputs.length > 0, 'Cell should have output after execution');
        const output = cell.outputs[0];
        assert.ok(output.items.length > 0, 'Output should have items');

        // Check for SPARQL results JSON
        const jsonItem = output.items.find(item => item.mime === 'application/sparql-results+json');
        assert.ok(jsonItem, 'Output should contain SPARQL results JSON');

        const resultText = new TextDecoder().decode(jsonItem.data);
        const result = JSON.parse(resultText);

        // Verify the structure of SPARQL results
        assert.ok(result.head, 'Result should have head');
        assert.ok(result.results, 'Result should have results');
        assert.ok(result.results.bindings, 'Result should have bindings');
        assert.ok(result.results.bindings.length > 0, 'Result should have at least one binding');

        // Verify that our test data is in the results
        const hasTestValue = result.results.bindings.some((binding: any) =>
            binding.o && binding.o.value === 'test value'
        );
        assert.ok(hasTestValue, 'Results should contain the test value from the Turtle file');
    });
});
