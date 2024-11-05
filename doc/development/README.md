# Development Notes

This document contains some notes about the development of the extension.

## Publishing the extension

The extension is published to vscode marketplace and open-vsx. Both versions are the same except the dependencies to other extensions. These dependencies are not really dependencies but recommendations to have a better experience with the extension. These extensions are not available in both market places. This is why we list them here. And if we deploy a new version for vscode marketplace or open-vsx we need to update the dependencies in the `package.json` file.

### vscode

These extensions are currently used in our vscode version:

```json
 "extensionDependencies": [
    "stardog-union.stardog-rdf-grammars",
    "stardog-union.vscode-langserver-sparql",
    "RandomFractalsInc.vscode-data-table"
  ]
```
What are they for?

**vscode-langserver-sparql**

"A Visual Studio Code extension providing language intelligence (autocomplete, diagnostics, hover tooltips, etc.) for the SPARQL query language, including both W3C standard SPARQL and Stardog extensions (e.g., PATHS queries), via the Language Server Protocol."

This means we have all these features in Notebook Cells with SPARQL language.

**Stardog RDF Grammars**

"Visual Studio Code syntax highlighting for all your favorite RDF languages, and a few Stardog-specific ones, too!"

This means we have syntax highlighting for all RDF languages.This is not really necessary but it is nice to have.

**RandomFractalsInc.vscode-data-table**

"These Data Table Renderers were created to enhance raw data views in Jupyter and custom VSCode Notebooks 📚."

This means extension provides more advanced rendering for data tables in Notebook Cells and can handle larger amount of data. If you have big results then this is the only way to see an output. Because our renderer is not optimized for big results.


### open-vsx

The stardog extensions are not available in vsx. 

```json
   "extensionDependencies": [
    "vemonet.stardog-rdf-grammars"
  ]
```

What are they for?

**vemonet.stardog-rdf-grammars** 
"Visual Studio Code syntax highlighting for all your favorite RDF languages, and a few Stardog-specific ones, too!"

They are the same as the vscode version. But released by another entity than stardog-union.


### Publishing to both

#### vscode marketplace

Just run the following command:

You can create a bundle and install the bundle locally to test it before publishing it to the marketplace.

```bash
 npm run package 
```

This will create a file like `sparql-notebook-0.0.39.vsix`. You can right click on it in vscode and install it. 

To publish it to the marketplace you need to run the following command:
```bash
npm run deploy
```
This runs the `npx vsce publish` command. You need the credentials to do this.

#### open-vsx

First of all we have to change the dependencies in the `package.json` file. Then we can run the following command:

```bash
cd vsx-utils
node replace-deps.js
```

This will replace the `extensionDependencies` in the `package.json` file. The old `package.json` file is saved as `package.json.bak`. 

Then we can package it with the same command as for vscode:

```bash
 npm run package 
```

This will create a file like `sparql-notebook-0.0.39.vsix`. You can right click on it in vscodium and install it.


After this you can upload the extension here [open-vsx](https://open-vsx.org/user-settings/extensions). You need credentials for this.

After this restore the old `package.json` file with the following command:

```bash
cd vsx-utils
node restore-deps.js
```
