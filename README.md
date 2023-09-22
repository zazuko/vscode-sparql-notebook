# VSCode SPARQL Notebook

This extension provides a _SPARQL Notebook_ mode for [Visual Studio Code](https://code.visualstudio.com). This is a powerful way to document SPARQL queries and make them execute as notebook code cells.

Use a SPARQL notebook to:

- Provide hands-on SPARQL training
- Document data available via SPARQL
- Validate data via SPARQL
- Run queries against a SPARQL endpoint
- Run queries against a local RDF file

This notebook can render SPARQL SELECT results and RDF graphs via SPARQL CONSTRUCT queries.

![sparql-notebook](https://user-images.githubusercontent.com/8033981/157274845-e722bace-16aa-4055-8a07-0b8fc5a8b112.gif)

The extension automatically installs the [Stardog RDF Grammars](https://marketplace.visualstudio.com/items?itemName=stardog-union.stardog-rdf-grammars) and [SPARQL Language Server](https://marketplace.visualstudio.com/items?itemName=stardog-union.vscode-langserver-sparql) extensions for SPARQL syntax highlighting and auto-completion.

This extension is still pretty raw but it works for us [tm]. Bug reports & contributions are very welcome!

## Features

- Open any `.sparqlbook` file as a Notebook.
- Execute query blocks in the Notebook UI and view output.
- Configure endpoint connections in the SPARQL Notebook side panel.
- Export a `.sparqlbook` file to Markdown.
- Attach `.sparql` or `.rq` files to cells.
- Use a local RDF file as a data source.

## Installation

You can install it directly from the Visual Studio Code Extension tab. It is available on the [Marketplace](https://marketplace.visualstudio.com/items?itemName=Zazuko.sparql-notebook)

## Usage

Open any `.sparqlbook` file with the `Open With` menu option. Then, select the `SPARQL Notebook` format. Connect to a SPARQL Endpoint and execute query blocks and view output interactively.

## Endpoints

Endpoints are the destinations for sending SPARQL queries, and there are two types:

### Remote Servers (HTTP / HTTPS)
You can connect to a remote server by clicking the `+` button in the `SPARQL Connections` panel. Fill in the server URL and optional credentials. If you omit credentials, the extension will attempt a connection without them. This connection is used throughout the entire notebook, except when a cell defines its own endpoint.

### Local Endpoints
Configure a local endpoint by right-clicking on a TTL, NT, or RDF file and selecting `SPARQL Notebook: Use File as Store`. This creates a new local endpoint populated with the chosen file's content. The entire notebook uses this endpoint, except when a cell specifies its own.

![local-file-store](https://github.com/zazuko/vscode-sparql-notebook/assets/8033981/c02dc4bd-1cd1-4c01-8032-cc2d74fceb5c)

### Cell-Specific Endpoints
You can assign an endpoint to a specific cell by adding a comment with the endpoint URL or file path in a code cell:

```sparql
# [endpoint=https://lindas.admin.ch/query]
```

or 
```sparql
# [endpoint=./relative/path/file.ttl]
```

```sparql
# [endpoint=/absolute/path/file.ttl]
```
Working with relative paths makes the notebook portable.

### Cell Status Bar
The cell status bar displays information about the endpoint in use and its source.

## Code Cell (SPARQL Cell)
A code cell contains a SPARQL query, which can be a SELECT, ASK, CONSTRUCT, or DESCRIBE query. Execute a code cell by clicking the Run Cell button in the cell toolbar or pressing Ctrl+Enter (or Option+Enter on Mac).

### Query from a file
You can attach a query file to a cell. The query file will load and execute when you run the cell. Supported file extensions include `.sparql` and `.rq`. Saving the notebook also saves the query file.

![ext-query](https://github.com/zazuko/vscode-sparql-notebook/assets/8033981/68da289e-1d1f-4b6d-9986-bcfc455aa15a)

### Cell Status Bar
The cell status bar indicates whether the cell uses a query file.

## FAQ

### Show SELECT Results as a Table

Technically that means set the default renderer for MIME-Type `application/sparql-results+json`.

1. in the output cell, choose `application/sparql-results+json`
2. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on Mac),
3. Search for "mime" and click: "Notebook: Save Mimetype Display Order"
4. You will be prompted to choose either to ...
   - enable that default setting globally (choose "User Settings")
   - or locally for that specific workspace (choose "Workspace Settings")

![save_mimetype_order](https://user-images.githubusercontent.com/8033981/172578922-73a4a3f5-3a55-4fc1-b961-bb4ce4df945c.gif)

### Export as Markdown

Right click a `.sparqlbook`file and select `Export to Markdown`.



## Contribute

This extension uses the [
Notebook API ](https://code.visualstudio.com/api/extension-guides/notebook). Contributions & bug fixes are always welcome!
h
## Credits

- Stardog VSCode Extensions, https://github.com/stardog-union/stardog-vsc
- Oxigraph, https://github.com/oxigraph

And all contributors ❤️