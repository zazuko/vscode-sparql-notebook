import { SparqlQuery } from '../../extension/endpoint/model/sparql-query';

export const HTTP_ENDPOINT_URL = 'http://example.com/sparql';
export const FILE_ENDPOINT_URL = 'file://example.com/sparql';
export const HTTP_ENDPOINT_COMMENT = `# [endpoint: ${HTTP_ENDPOINT_URL}]`;
export const FILE_ENDPOINT_COMMENT = `# [endpoint: ${FILE_ENDPOINT_URL}]`;

export const CONSTRUCT_QUERY = `
#
# This is a comment

CONSTRUCT {
  ?s ?p ?o
}
WHERE {
  ?s ?p ?o
}
`;

export const HTTP_ENDPOINT_CONSTRUCT_QUERY_STRING = `
#
# This is a comment

CONSTRUCT {
  ?s ?p ?o
}
WHERE {
  ?s ?p ?o
}
`;


export const FILE_ENDPOINT_CONSTRUCT_QUERY_STRING = `
#
# This is a comment
# ${FILE_ENDPOINT_COMMENT}

CONSTRUCT {
  ?s ?p ?o
}
WHERE {
  ?s ?p ?o
}
`;

export const httpEndpointConstructQuery = new SparqlQuery(HTTP_ENDPOINT_CONSTRUCT_QUERY_STRING);
export const fileEndpointConstructQuery = new SparqlQuery(FILE_ENDPOINT_CONSTRUCT_QUERY_STRING);
export const constructQuery = new SparqlQuery(CONSTRUCT_QUERY);