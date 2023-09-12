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

## Installation

You can install it directly from the Visual Studio Code Extension tab. It is available on the [Marketplace](https://marketplace.visualstudio.com/items?itemName=Zazuko.sparql-notebook)

## Usage

Open any `.sparqlbook` file with the `Open With` menu option. Then, select the `SPARQL Notebook` format. Connect to a SPARQL Endpoint and execute query blocks and view output interactively.

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

### Use query files

You can attach a query file to a cell. The query file will be loaded and executed when the cell is executed. The query file can be a `.sparql` or `.rq` file.

The query files will be updated on notebook save.

![ext-query](https://github.com/zazuko/vscode-sparql-notebook/assets/8033981/68da289e-1d1f-4b6d-9986-bcfc455aa15a)


## Contribute

This extension uses the [
Notebook API ](https://code.visualstudio.com/api/extension-guides/notebook). Contributions & bug fixes are always welcome!

# Development

The notebook extension is located in `src/extension`.

## Notebook Output Cells
### SELECT / ASK Results
A "renderer" refers to a component or extension that is responsible for displaying specific types of content or output within a notebook cell.

This project provides a renderer for `application/sparql-results+json` MIME-Type. This is the MIME-Type that is used to represent SPARQL SELECT and SPARQL ASK results.

You find the renderer in `src/renderer`. It is a simple React component that renders a table.