# VSCode SPARQL Notebook

This extension provides a *SPARQL Notebook* mode for [Visual Studio Code](https://code.visualstudio.com). This is a powerful way to document SPARQL queries and make them execute as notebook code cells.

Use a SPARQL notebook to:

* Provide hands-on SPARQL training
* Document data available via SPARQL
* Validate data via SPARQL

This notebook can render SPARQL SELECT results and RDF graphs via SPARQL CONSTRUCT queries.

![sparql-notebook](https://user-images.githubusercontent.com/8033981/157274845-e722bace-16aa-4055-8a07-0b8fc5a8b112.gif)

We recommend using it in conjunction with the [Stardog RDF Grammars](https://marketplace.visualstudio.com/items?itemName=stardog-union.stardog-rdf-grammars) and [SPARQL Language Server](https://marketplace.visualstudio.com/items?itemName=stardog-union.vscode-langserver-sparql) for SPARQL syntax highlighting and auto-completion.

This extension is still pretty raw but it works for us [tm]. Bug reports & contributions are very welcome!

## Features

- Open any `.sparqlbook` file as a Notebook.
- Execute query blocks in the Notebook UI and view output.
- Configure endpoint connections in the SPARQL Notebook side panel.
## Installation

You can install it directly from the Visual Studio Code Extension tab. It is available on the [Marketplace](https://marketplace.visualstudio.com/items?itemName=Zazuko.sparql-notebook)

## Usage

Open any `.sparqlbook` file with the `Open With` menu option. Then, select the `SPARQL Notebook` format. Connect to a SPARQL Endpoint and execute query blocks and view output interactively.

## Contribute

This extension uses the [
Notebook API ](https://code.visualstudio.com/api/extension-guides/notebook). Contributions & bug fixes are always welcome!

