
```sparql
# [endpoint=https://lindas.admin.ch/query]

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
