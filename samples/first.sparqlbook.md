# Test Notebook

This is a sample notebook. You can add Code and Mardown cells.

```sparql
#
# Test [endpoint=https://query.wikidata.org/bigdata/namespace/wdq/sparql] Test 
# 
PREFIX schema: <http://schema.org/>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX bd: <http://www.bigdata.com/rdf#>


SELECT DISTINCT ?ms ?msLabel ?hos ?hosLabel 
 
WHERE {
  ?ms wdt:P463 wd:Q458;
      wdt:P35 ?hos .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
```
get canton berne

```sparql
#
# [endpoint=https://lindas.admin.ch/query]
#
PREFIX gont: <https://gont.ch/>
PREFIX schema: <http://schema.org/>
SELECT ?name ?abbr ?date  ?p ?o WHERE {
    { 
        ?canton a gont:Canton;
            gont:cantonAbbreviation ?abbr ;
            gont:date ?date ;
            gont:longName ?name . 
    } UNION {
        gont:Canton ?p ?o .
    }
} 
```

```sparql
# [endpoint=https://lindas.admin.ch/query]

PREFIX canton: <http://classifications.data.admin.ch/canton/>
PREFIX gont: <https://gont.ch/>
PREFIX purl: <http://purl.org/dc/terms/> 
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

DESCRIBE canton:BL

```

```sparql
# [endpoint=https://lindas.admin.ch/query]

ASK {
    ?s ?p ?o .
} LIMIT 1
```

```sparql
# [endpoint=https://lindas.admin.ch/query]

ASK {
    ?s a <http://example.org/doesnotexist> .
} LIMIT 1
```
