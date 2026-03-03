# Zazuko SPARQL Notebook 

## Overview

The **SPARQL Notebook for VSCode** extension enables users to run SPARQL queries directly within VSCode using a notebook-like interface with **Markdown** and **Code cells**. This versatile setup supports querying both remote HTTP/HTTPS SPARQL endpoints and local RDF files. The extension includes a **side panel for managing endpoint connections**, allowing you to seamlessly set up and switch between different SPARQL endpoints.

### Key Features
- **Query Execution on HTTP/HTTPS Endpoints**: Run SPARQL queries directly against remote SPARQL endpoints with HTTP/HTTPS protocols.
- **SHACL Validation**: Validate RDF data using SHACL shapes against remote endpoints that support SHACL (e.g., Apache Jena Fuseki). SHACL cells use Turtle syntax and return validation reports.
- **Markdown Integration**: Execute SPARQL and SHACL code blocks directly from any markdown file. Open markdown files as notebooks to get the full notebook experience with inline results.
- **Binding Local Query Files to Code Cells**: Bind local `.sparql`, `.rq`, `.shacl`, or `.ttl` files directly to code cells, allowing the contents of these files to be embedded within the notebook cell itself. This approach enables you to develop and document queries in a dedicated file while keeping the query available within the notebook for easy execution. Markdown cells can be used alongside these code cells to add explanations or documentation.
- **RDF File Querying**: Execute SPARQL queries on local RDF files (e.g., Turtle, RDF-XML) by providing a file path or pattern. This is especially useful when transforming data to RDF format and verifying the output with SPARQL before committing it to a triple store.
- **Markdown and Code Cells**: Use Markdown cells for explanations and Code cells for SPARQL queries or SHACL shapes. This format is ideal for creating a rich, interactive documentation environment around your queries.

While it’s a powerful tool for working with SPARQL and RDF data, the SPARQL Notebook is adaptable to a range of use cases beyond data science. Whether you’re building transformation workflows or simply documenting and testing queries. If there are any features missing for your specific use case, feel free to request them.


## HTTP Endpoint
To configure connections to SPARQL endpoints, click on the **SPARQL Notebook** icon on the left sidebar to open the **Connections** panel. This panel allows you to manage your SPARQL endpoint connections with ease.

To add a new connection, click the **+** icon in the top right corner. Both HTTP and HTTPS endpoints are supported.

![Connections](./img/endpoint-connection.png)

To delete an endpoint connection, simply use the context menu (right-click on the connection) to remove it when it’s no longer needed.

> **Note:**
> 
> Using these connections is not "portable". It another user opens the notebook, they will not have the same connections.
> The connections are stored in the user settings of VSCode.

> **Note:**
> 
> Currently not supported:
> - SSL client certificates
> - Proxy

## Endpoints from Cells
You can also define endpoints directly in a cell. This is useful if you want to share the notebook with others and don't want to rely on the connections. This is very useful for sharing the notebook with others. But for it is limited to HTTP/HTTPS SPARQL endpoints without authentication or files (we come to that later). 

This is an example how you provide a SPARQL endpoint in a cell:

```sparql
#
# Test [endpoint=https://query.wikidata.org/bigdata/namespace/wdq/sparql]
# 
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>

SELECT DISTINCT ?euMemberCountry ?euMemberCountryLabel ?headOfState ?headOfStateLabel
 
WHERE {
  ?euMemberCountry wdt:P463 wd:Q458;
      wdt:P35 ?headOfState .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
```
The `[endpoint=https://query.wikidata.org/bigdata/namespace/wdq/sparql]` configures the endpoint for this cell.

## Local RDF Files
You can also query local files. This is useful if you want to query RDF files on your local machine. This is an example how you provide a file in a cell:

```sparql
#
# Test [endpoint=./data/00_intro.ttl]

SELECT ?s ?p ?o
WHERE {
  ?s ?p ?o
} LIMIT 10
```

You can provide a file path or a glob pattern.

Here are a few patterns:
```sparql
# [endpoint=./rdf/a.nt]
```
or
```sparql
# [endpoint=./rdf/*]
```
or
```sparql
# [endpoint=rdf/*]
```
or
```sparql
# [endpoint=./rdf/{a,b}.ttl]
```
or
```sparql
# [endpoint=rdf/a.ttl]
# [endpoint=./rdf/b.ttl]
```

You can go here to see the [Glob Patterns Reference](https://code.visualstudio.com/docs/editor/glob-patterns).


There is another option to provide a file. You can navigate in the vscode file explorer to the file you want to query and then right-click on the file and select `SPARQL Notebook: Use File as Store`.

![Connections](./img/use-file.png)

> **Note:**
> 
> File patterns in the comment are more flexible than the right-click option. But it is not doing the same thing. 
> If you use the flexible comment option then every time you execute the query it will create a new store and load the
> data from the file. If you use the right-click option then it will load the data only once and you can execute the query. But if you change the file then you have to reload the data in the same way.
> The right-click option is more efficient if you have a large file and you want to execute the query multiple times.


**FAQ:**

**Q:** Can I use a file with a different extension than `.ttl`?

YES

| File Extension | MIME Type          |
|----------------|--------------------|
| .ttl           | text/turtle        |
| .nt            | application/n-triples|
| .rdf           | application/rdf+xml|
| .trig          | application/trig   |
| .nq            | application/n-quads|

**Q:** Do you ship with a SPARQL endpoint?

YES. The notebook is using the amazing [Oxigraph](https://github.com/oxigraph/oxigraph) engine.

**Q:** It there a limit for local rdf files?

YES. The limit is currently approx 1G per file. But you can load multiple files. Just try it out.


## Local Query Files
You can also bind local `.sparql` or `.rq` files to code cells. This is useful if you want to develop and document queries in a dedicated file while keeping the query available within the notebook for easy execution. This is an example how you provide a file in a cell:

![Include query from file](./img/external-query.png)

> **Note:**
>
> If you change the cell content and save the notebook then the content of the file will be updated.

## SHACL Validation

In addition to SPARQL, the notebook supports **SHACL validation** against remote SPARQL endpoints that provide a SHACL validation service (such as Apache Jena Fuseki).

### How SHACL Works in the Notebook

SHACL (Shapes Constraint Language) is used to validate RDF graphs against a set of conditions (shapes). In the notebook:

1. Create a code cell and change the language from `sparql` to `shacl`
2. Write your SHACL shapes in Turtle syntax
3. Specify the endpoint URL (including any required parameters like the target graph)
4. Execute the cell to see the validation report

### Configuring SHACL Endpoints

SHACL validation requires specifying the full endpoint URL, including any parameters required by your SHACL service. Use the `[endpoint=...]` comment:

```shacl
# [endpoint=http://localhost:3030/dataset/shacl?graph=default]

@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1 ;
        sh:datatype xsd:string ;
    ] .
```

### SHACL with Apache Jena Fuseki

Apache Jena Fuseki provides a SHACL validation endpoint. Following the [Jena SHACL documentation](https://jena.apache.org/documentation/shacl/), the endpoint URL typically follows this pattern:

```
http://localhost:3030/<dataset>/shacl?graph=<graph-to-validate>
```

Where:
- `<dataset>` is your Fuseki dataset name
- `<graph-to-validate>` is `default` for the default graph, or a named graph URI

### Binding SHACL Files to Cells

Similar to SPARQL files, you can bind local `.shacl` or `.ttl` files to SHACL cells. Use the "Add Query from File" option in the cell menu and select a SHACL file. Files with `.shacl` or `.ttl` extensions will automatically be recognized as SHACL cells.

> **Note:**
>
> SHACL validation is only supported for HTTP/HTTPS endpoints. Local file-based validation is not currently supported.

> **Note:**
>
> The validation result is returned in Turtle format, containing the SHACL validation report.

## Markdown Integration

The SPARQL Notebook extension allows you to execute SPARQL and SHACL code blocks directly from any markdown file. This is useful for:

- Documenting queries in README files with executable examples
- Creating tutorials with runnable code samples
- Working with existing markdown documentation that contains SPARQL/SHACL snippets

### How to Use Markdown Integration

1. Open any `.md` or `.markdown` file in VS Code
2. Right-click on the file in the Explorer or use the editor title bar
3. Select **"Open With..."**
4. Choose **"SPARQL Markdown Notebook"**

The markdown file will open in a notebook view where:
- Regular markdown text becomes markdown cells
- Code blocks with ` ```sparql ` become executable SPARQL cells
- Code blocks with ` ```shacl ` become executable SHACL cells
- Other code blocks (e.g., JavaScript, Python) remain as markdown

### Example Markdown with SPARQL

Create a markdown file with SPARQL code blocks:

````markdown
# My SPARQL Documentation

This query fetches cities from DBpedia:

```sparql
# [endpoint=https://dbpedia.org/sparql]
PREFIX dbo: <http://dbpedia.org/ontology/>
SELECT ?city WHERE { ?city a dbo:City } LIMIT 10
```
````

When opened as a SPARQL Markdown Notebook, the code block becomes an executable cell with inline results.

### Configuration

The markdown integration is enabled by default. You can disable it in VS Code settings:

```json
{
  "sparqlbook.markdownIntegration.enabled": false
}
```

When disabled, the "SPARQL Markdown Notebook" option will not appear in the "Open With..." menu.

### Preserving Markdown Formatting

When you save a file opened as a SPARQL Markdown Notebook, it will be saved back as valid markdown. The structure is preserved:
- Markdown cells become regular markdown text
- SPARQL/SHACL cells become fenced code blocks with the appropriate language tag

This means your markdown files remain compatible with any markdown viewer or documentation system.

## Export to MARKDOWN

A notebook can be exported to a markdown file. Find the file in the vscode file explorer and right-click on the file and select `SPARQL Notebook: Export to Markdown`.


## Result Cells
Query results are displayed within dedicated result cells, with display formats tailored to different query types.

- **SELECT and ASK Queries**: Results from these queries are shown in a table format, making it easy to view and analyze tabular data.
- **CONSTRUCT and DESCRIBE Queries**: Results from these queries are rendered as a graph, providing a visual representation of RDF triples.

The notebook offers flexible display options through **renderers** specific to different MIME types. Some extensions also provide additional renderers for specific MIME types, enabling a more customized visualization experience for various data formats.
This extension is shipped with a few renderers. We include the extension ["Data Table Renderers from Random Fractals Inc."](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.vscode-data-table) which provides better table rendering for large tables. 

You can change the result renderer like this: 
![Change Result Renderer](./img/change-renderer.png)

Then the top middle menu show the available renderers. Just choose the one you like.

![The new renderer](./img/another-renderer.png)

> **Note:**
> 
> How to set the current renderer as default?
> To set the current renderer as default, you can use the VSCode command palette:
> 
> 1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on Mac),
> 2. Type and select `Notebook: Save Mimetype Display Order`.

> **Note:**
>
> Our renderers are not designed for a large amount of data. Use the `Data Table Renderers from Random Fractals Inc.` extension for large data.

## SPARQL Anything

This has nothing todo with this notebook but i will show you how to use SPARQL Anything. We don't ship it with this extension but you can get it from https://sparql-anything.cc/.
You can run it in server mode and connect the notebook to it. 

Run sparql-anything in server mode:
```bash
java -jar sparql-anything-server-<version>.jar 
```

Then you can use it in the notebook like this:

```sparql
# [endpoint=http://localhost:3000/sparql.anything]

PREFIX fx: <http://sparql.xyz/facade-x/ns/>
PREFIX schema: <http://schema.org/>
PREFIX xyz: <http://sparql.xyz/facade-x/data/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX myns: <http://example.org/myns/>

CONSTRUCT {
   ?s ?p ?o .
} WHERE {
     # file relative to the SPARQL anything server
     SERVICE<x-sparql-anything:>{
        fx:properties fx:location "../input/2024-03-08 AKN4ZH ACT A0.xml";  
                      fx:media-type "application/xml".  
            ?s ?p ?o .
    }
}
```