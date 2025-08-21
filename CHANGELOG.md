# Change Log

All notable changes to the "vscode-sparql-notebook" extension will be documented in this file.

## 1.0.7
- Experimental Feature: The result table renderer now supports Triple Terms as defined in RDF 1.2

## 1.0.6
- Feature: Proxy Support
The SPARQL notebook now uses the `fetch` API provided by VS Code for HTTP queries. This update enables proxy support, which is fully handled by the VS Code `fetch` implementation and works transparently for extensions.

## 1.0.5
- Feature: Support SPARQL UPDATE queries. They work if the endpoint supports it. But it's not supported by the file endpoint. Support for systems with separate read and write endpoints will be added in the future.

## 1.0.4
- You can now enable the union graph in file queries by passing the query parameter as a comment in the SPARQL query: `[use_default_graph_as_union=true]`.
```sparql
# [endpoint=./rdf/a.trig]
# [use_default_graph_as_union=true]


SELECT * WHERE {
    ?s ?p ?o
}
```

## 1.0.3
- Fix: Do not send HTTP Authorization header if the password/passowrd is empty

## 1.0.2
- Fix: Relative File Pattern with '../' in the path

## 1.0.1
- Add content type 'text/turtle' to construct query results (needed to support Turtle output renderer)

## 1.0.0
- Release 1.0.0 without changes

## 0.0.39
- Oxigraph update
- Feature: You can load multiple files for "local" queries.

## 0.0.38
- Oxigraph update
- Fix: Correct SPARQL select result order
- Fix: Correct SPARQL optional empty filed rendering

## 0.0.37
- Fix: Windows path issue with external query files.

## 0.0.36
- Fix: Change content types to improve compatibility with Data Table Renderer
- Fix: Contain Table style to avoid conflicts with other extensions
- Feature: Add [Random Fractals Inc. Data Table Renderers](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.vscode-data-table) as a dependency 

## 0.0.35
- Feature: The connection error show now a connect button.

## 0.0.34
- Fix: Change query kind detection to be more accurate.

## 0.0.33
- Feature: Data Table Renderer Compatible Output
- Special Thanks: @vhorvath (Viktor Horvath)
- Update: Oxigraph

## 0.0.32
internal

## 0.0.31
- Feature: Add Code Cell Statusbar Item to show connection endpoint url or file path.
- Feature: Add Code Cell Statusbar Item to show the source of the cell content (cell or file)
- Feature: Accept file paths as endpoint url.

## 0.0.30
- Fix: Store external query files in onDidSaveNotebookDocument callback. This is needed to make the notebook file portable.

## 0.0.29
- Fix: Store external query files relative to the notebook file. This is needed to make the notebook file portable.

## 0.0.28
- Minor: Shorten Blank Node IDs
- Minor: Add extension dependencies

## 0.0.27
- Fix: Rename command

## 0.0.26
- Fix: Sparql Result JSON rendering with optional
- Feature: Use an RDF file as a data source

## 0.0.25
- Feature: Better Stardog errors
- Feature: Copy IRI to clipboard

## 0.0.24
- Fix: Set proper accept header depending on the query type.

## 0.0.23
- Fix: Add a component for blank node rendering for `application/sparql-results+json`.

## 0.0.22
- Feature: New react renderer for `application/sparql-results+json`.

## 0.0.21
- Fix: Problem with new connections with an empty password.

## 0.0.20
- Update readme

## 0.0.19
- Feature: Attach .sparql or .rq files to cells

##  0.0.18
- Updated webpack build to improve performance and reduce file size
- Added support for Visual Studio Code version 1.77
- Minor bug fixes and improvements 

##  0.0.17
- Format *.sparqlbook files to improve version control. 

##  0.0.16
- Feature: Initial support for abort query.
- Improve error handling

##  0.0.15
- Fix: SELECT result first column CSS

## 0.0.14
- Fix: Error handling.
- Special Thanks: Vojtěch Musílek

## 0.0.13
- Fix: ASK query with 'sparqlbook.useNamespaces' true.

## 0.0.12
- Fix: Query POST created invalid route for this sparql database: Oxigraph. Remove tailoring '/' from the endpoint.
- Feature: SPARQL SELECT results uses now prefixes from the query. You can disable this behavior with the setting 'sparqlbook.useNamespaces'.

- Special Thanks: Vojtěch Musílek, Ivo Velitchkov

## 0.0.11
- Feature: New `application/sparql-results+json` renderer with dark and light mode support.
- Feature: Export Notebook as Markdown.

## 0.0.10
- Feature: Configure endpoint per cell. Add a comment like `# [endpoint=http://....]` to your SPARQL Query.
- Feature: New rendering for TTL output

## 0.0.9
- Fix: content type with charset `application/sparql-results+json;charset=utf-8` not recognized

## 0.0.8
- Update description

## 0.0.7
- Initial release!
