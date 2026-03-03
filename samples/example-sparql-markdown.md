# SPARQL Markdown Notebook Example

This markdown file demonstrates the SPARQL Notebook markdown integration.
You can execute SPARQL and SHACL code blocks directly from this file.

## How to Use

1. Right-click on this file in VS Code Explorer
2. Select "Open With..."
3. Choose "SPARQL Markdown Notebook"
4. Click the play button next to any SPARQL or SHACL code block to execute it

## Example SPARQL Query

The following query retrieves data from a SPARQL endpoint.
Make sure you're connected to a SPARQL endpoint first.

```sparql
# [endpoint=https://dbpedia.org/sparql]
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?city ?name ?population
WHERE {
  ?city a dbo:City ;
        rdfs:label ?name ;
        dbo:populationTotal ?population .
  FILTER(lang(?name) = "en")
}
ORDER BY DESC(?population)
LIMIT 10
```

## Another SPARQL Query

You can have multiple SPARQL blocks in the same markdown file:

```sparql
# [endpoint=https://dbpedia.org/sparql]
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

ASK {
  ?city a dbo:City .
}
```

## SHACL Validation Example

You can also include SHACL validation blocks:

```shacl
# [endpoint=http://localhost:3030/dataset/shacl?graph=default]
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:name ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
    ] .
```

## Non-executable Code Blocks

Code blocks with other languages will remain as regular markdown:

```javascript
console.log("This is just regular JavaScript code");
```

```python
print("This is just regular Python code")
```

## Notes

- Results appear inline below each code cell
- You can specify endpoints per code block using `# [endpoint=...]` comments
- The file remains valid markdown and can be viewed normally in any markdown viewer
