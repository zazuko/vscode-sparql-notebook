import assert from 'assert';
import * as vscode from 'vscode';


export const HTTP_ENDPOINT_URL = 'http://example.com/sparql';
export const FILE_ENDPOINT_URL = 'file://example.com/sparql';
export const HTTP_ENDPOINT_COMMENT = `# [endpoint=${HTTP_ENDPOINT_URL}]`;
export const FILE_ENDPOINT_COMMENT = `# [endpoint=${FILE_ENDPOINT_URL}]`;

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


suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('SparqlQuery Class: Extract HTTP endpoint from Query');



});


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
