import assert from 'assert';
import * as vscode from 'vscode';


import { SparqlQuery } from '../../../../extension/endpoint/model/sparql-query';



suite('SPARQL HTTP Endpoint Test Suite', () => {
  vscode.window.showInformationMessage('Start SPARQL HTTP Endpoint tests.');


  test('SPARQL Query: No Endpoint in Query', () => {

    const QUERY_WITHOUT_ENDPOINT = `
#
# This is a comment

CONSTRUCT {
  ?s ?p ?o
}
WHERE {
  ?s ?p ?o
}
`;
    const query = new SparqlQuery(QUERY_WITHOUT_ENDPOINT);
    const extracted = query.extractEndpoint();
    const endpoints = extracted.getEndpoints();
    assert.strictEqual(endpoints.length, 0);
  }
  );



  test('SPARQL Query: HTTP Endpoint in Query', () => {
    const HTTP_ENDPOINT_URL = 'http://example.com/sparql';
    const HTTP_ENDPOINT_URL2 = 'http://example.com/sparql2';

    const QUERY_WITH_HTTP_ENDPOINT = `
#
# This is a comment
# [endpoint=${HTTP_ENDPOINT_URL}]

CONSTRUCT {
  ?s ?p ?o
}
#  second [endpoint=${HTTP_ENDPOINT_URL2}]
WHERE {
  ?s ?p ?o
}
`;
    console.log('Testing query:', QUERY_WITH_HTTP_ENDPOINT);
    const query = new SparqlQuery(QUERY_WITH_HTTP_ENDPOINT);
    const extracted = query.extractEndpoint();
    console.log('Extracted query:', extracted);
    const endpoints = extracted.getEndpoints();
    console.log('Extracted endpoints:', endpoints);
    assert.strictEqual(endpoints.length, 1);
    const endpoint = endpoints[0];
    assert.strictEqual(endpoint.kind, 'http');
    assert.strictEqual(endpoint.endpoint, HTTP_ENDPOINT_URL);

  })


  test('SPARQL Query: Two HTTP Endpoint in Query anywhere', () => {
    const HTTP_ENDPOINT_URL = 'http://example.com/sparql';
    const HTTP_ENDPOINT_URL2 = 'http://example.com/sparql2';


    const QUERY_WITH_2_HTTP_ENDPOINTS = `
#
# This is a comment
# [endpoint=${HTTP_ENDPOINT_URL}]

CONSTRUCT {
  ?s ?p ?o
}
# [endpoint=${HTTP_ENDPOINT_URL}]
WHERE {
  ?s ?p ?o
}
`;
    const query = new SparqlQuery(QUERY_WITH_2_HTTP_ENDPOINTS);
    const extracted = query.extractEndpoint();
    const endpoints = extracted.getEndpoints();

    console.log('Extracted endpoints:', endpoints);
    assert.strictEqual(endpoints.length, 1);
    const endpoint1 = endpoints[0];
    assert.strictEqual(endpoint1.kind, 'http');
    assert.strictEqual(endpoint1.endpoint, HTTP_ENDPOINT_URL);

    const endpoint2 = endpoints[0];
    assert.strictEqual(endpoint2.kind, 'http');
    assert.strictEqual(endpoint2.endpoint, HTTP_ENDPOINT_URL2);

  })

});


