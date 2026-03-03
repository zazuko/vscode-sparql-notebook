import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Markdown Notebook Serializer Test Suite', () => {
    let tmpDir: string;

    setup(async () => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-sparql-markdown-test-'));
    });

    teardown(async () => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    test('Parses markdown with SPARQL code block into notebook cells', async () => {
        const markdownContent = `# Test Document

This is some introductory text.

\`\`\`sparql
SELECT * WHERE { ?s ?p ?o }
\`\`\`

Some more text after the query.
`;
        const markdownFile = 'test.md';
        fs.writeFileSync(path.join(tmpDir, markdownFile), markdownContent);

        const uri = vscode.Uri.file(path.join(tmpDir, markdownFile));
        const document = await vscode.workspace.openNotebookDocument(uri);

        // Should have 3 cells: markdown, code, markdown
        assert.strictEqual(document.cellCount, 3, 'Should have 3 cells');

        // First cell should be markdown
        const cell1 = document.cellAt(0);
        assert.strictEqual(cell1.kind, vscode.NotebookCellKind.Markup, 'First cell should be markup');
        assert.ok(cell1.document.getText().includes('# Test Document'), 'First cell should contain title');

        // Second cell should be SPARQL code
        const cell2 = document.cellAt(1);
        assert.strictEqual(cell2.kind, vscode.NotebookCellKind.Code, 'Second cell should be code');
        assert.strictEqual(cell2.document.languageId, 'sparql', 'Second cell language should be sparql');
        assert.ok(cell2.document.getText().includes('SELECT * WHERE'), 'Second cell should contain SPARQL query');

        // Third cell should be markdown
        const cell3 = document.cellAt(2);
        assert.strictEqual(cell3.kind, vscode.NotebookCellKind.Markup, 'Third cell should be markup');
        assert.ok(cell3.document.getText().includes('Some more text'), 'Third cell should contain trailing text');
    });

    test('Parses markdown with SHACL code block into notebook cells', async () => {
        const markdownContent = `# SHACL Test

\`\`\`shacl
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .

ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person .
\`\`\`
`;
        const markdownFile = 'shacl-test.md';
        fs.writeFileSync(path.join(tmpDir, markdownFile), markdownContent);

        const uri = vscode.Uri.file(path.join(tmpDir, markdownFile));
        const document = await vscode.workspace.openNotebookDocument(uri);

        // Should have 2 cells: markdown, code
        assert.strictEqual(document.cellCount, 2, 'Should have 2 cells');

        // Second cell should be SHACL code
        const cell2 = document.cellAt(1);
        assert.strictEqual(cell2.kind, vscode.NotebookCellKind.Code, 'Second cell should be code');
        assert.strictEqual(cell2.document.languageId, 'shacl', 'Second cell language should be shacl');
        assert.ok(cell2.document.getText().includes('sh:NodeShape'), 'Second cell should contain SHACL shape');
    });

    test('Keeps non-SPARQL/SHACL code blocks as markdown', async () => {
        const markdownContent = `# Code Examples

JavaScript example:

\`\`\`javascript
console.log("Hello");
\`\`\`

Python example:

\`\`\`python
print("Hello")
\`\`\`
`;
        const markdownFile = 'other-code.md';
        fs.writeFileSync(path.join(tmpDir, markdownFile), markdownContent);

        const uri = vscode.Uri.file(path.join(tmpDir, markdownFile));
        const document = await vscode.workspace.openNotebookDocument(uri);

        // All content should be in markup cells since no SPARQL/SHACL
        for (let i = 0; i < document.cellCount; i++) {
            const cell = document.cellAt(i);
            assert.strictEqual(cell.kind, vscode.NotebookCellKind.Markup, `Cell ${i} should be markup`);
        }
    });

    test('Parses mixed SPARQL and SHACL code blocks', async () => {
        const markdownContent = `# Mixed Document

SPARQL query:

\`\`\`sparql
SELECT ?s WHERE { ?s a ?type }
\`\`\`

SHACL shape:

\`\`\`shacl
@prefix sh: <http://www.w3.org/ns/shacl#> .
ex:Shape a sh:NodeShape .
\`\`\`

Another SPARQL query:

\`\`\`sparql
ASK { ?s ?p ?o }
\`\`\`
`;
        const markdownFile = 'mixed.md';
        fs.writeFileSync(path.join(tmpDir, markdownFile), markdownContent);

        const uri = vscode.Uri.file(path.join(tmpDir, markdownFile));
        const document = await vscode.workspace.openNotebookDocument(uri);

        // Count code cells
        let sparqlCount = 0;
        let shaclCount = 0;
        for (let i = 0; i < document.cellCount; i++) {
            const cell = document.cellAt(i);
            if (cell.kind === vscode.NotebookCellKind.Code) {
                if (cell.document.languageId === 'sparql') {
                    sparqlCount++;
                } else if (cell.document.languageId === 'shacl') {
                    shaclCount++;
                }
            }
        }

        assert.strictEqual(sparqlCount, 2, 'Should have 2 SPARQL cells');
        assert.strictEqual(shaclCount, 1, 'Should have 1 SHACL cell');
    });

    test('Handles case-insensitive language identifiers', async () => {
        const markdownContent = `# Case Test

\`\`\`SPARQL
SELECT * WHERE { ?s ?p ?o }
\`\`\`

\`\`\`Shacl
ex:Shape a sh:NodeShape .
\`\`\`
`;
        const markdownFile = 'case-test.md';
        fs.writeFileSync(path.join(tmpDir, markdownFile), markdownContent);

        const uri = vscode.Uri.file(path.join(tmpDir, markdownFile));
        const document = await vscode.workspace.openNotebookDocument(uri);

        // Should recognize both as code cells despite different casing
        let codeCount = 0;
        for (let i = 0; i < document.cellCount; i++) {
            const cell = document.cellAt(i);
            if (cell.kind === vscode.NotebookCellKind.Code) {
                codeCount++;
            }
        }

        assert.strictEqual(codeCount, 2, 'Should have 2 code cells regardless of case');
    });

    test('Executes SPARQL query from markdown file against file endpoint', async () => {
        // Create a Turtle file with sample RDF data
        const dataFile = 'data.ttl';
        const turtleData = `@prefix ex: <http://example.org/> .

ex:subject ex:predicate "markdown test value" .
`;
        fs.writeFileSync(path.join(tmpDir, dataFile), turtleData);

        // Create markdown file with SPARQL query
        const markdownContent = `# Query Test

\`\`\`sparql
# [endpoint=${dataFile}]

SELECT ?s ?p ?o WHERE {
    ?s ?p ?o
}
\`\`\`
`;
        const markdownFile = 'query-test.md';
        fs.writeFileSync(path.join(tmpDir, markdownFile), markdownContent);

        const uri = vscode.Uri.file(path.join(tmpDir, markdownFile));
        const document = await vscode.workspace.openNotebookDocument(uri);
        await vscode.window.showNotebookDocument(document);

        // Find the code cell
        let codeCell: vscode.NotebookCell | undefined;
        for (let i = 0; i < document.cellCount; i++) {
            const cell = document.cellAt(i);
            if (cell.kind === vscode.NotebookCellKind.Code) {
                codeCell = cell;
                break;
            }
        }

        assert.ok(codeCell, 'Should have a code cell');

        // Execute the cell
        await vscode.commands.executeCommand('notebook.cell.execute', {
            ranges: [{ start: codeCell!.index, end: codeCell!.index + 1 }],
            document: uri
        });

        // Wait for execution to complete
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                disposable.dispose();
                reject(new Error('Cell execution timed out'));
            }, 10000);

            const disposable = vscode.workspace.onDidChangeNotebookDocument(e => {
                if (e.notebook.uri.toString() === uri.toString()) {
                    const cell = e.notebook.cellAt(codeCell!.index);
                    if (cell.outputs.length > 0) {
                        clearTimeout(timeout);
                        disposable.dispose();
                        resolve();
                    }
                }
            });

            // Check if output already exists
            if (codeCell!.outputs.length > 0) {
                clearTimeout(timeout);
                disposable.dispose();
                resolve();
            }
        });

        // Verify the output
        assert.ok(codeCell!.outputs.length > 0, 'Cell should have output after execution');
        const output = codeCell!.outputs[0];
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

        // Verify that our test data is in the results
        const hasTestValue = result.results.bindings.some((binding: any) =>
            binding.o && binding.o.value === 'markdown test value'
        );
        assert.ok(hasTestValue, 'Results should contain the test value from the Turtle file');
    });

    test('Handles empty markdown file', async () => {
        const markdownFile = 'empty.md';
        fs.writeFileSync(path.join(tmpDir, markdownFile), '');

        const uri = vscode.Uri.file(path.join(tmpDir, markdownFile));
        const document = await vscode.workspace.openNotebookDocument(uri);

        assert.strictEqual(document.cellCount, 0, 'Empty file should have no cells');
    });

    test('Handles markdown with only text (no code blocks)', async () => {
        const markdownContent = `# Plain Document

This is just plain text without any code blocks.

## Another Section

More text here.
`;
        const markdownFile = 'plain.md';
        fs.writeFileSync(path.join(tmpDir, markdownFile), markdownContent);

        const uri = vscode.Uri.file(path.join(tmpDir, markdownFile));
        const document = await vscode.workspace.openNotebookDocument(uri);

        // Should have one markup cell with all the content
        assert.ok(document.cellCount >= 1, 'Should have at least one cell');

        const cell = document.cellAt(0);
        assert.strictEqual(cell.kind, vscode.NotebookCellKind.Markup, 'Cell should be markup');
    });
});
