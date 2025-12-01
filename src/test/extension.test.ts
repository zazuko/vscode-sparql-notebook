import * as assert from 'assert';

import { constructQuery, httpEndpointConstructQuery, fileEndpointConstructQuery, FILE_ENDPOINT_URL, HTTP_ENDPOINT_URL } from './sparql-query/sample-query';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension/extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('SPARQL Query', () => {


		const httpEndpoints = httpEndpointConstructQuery.extractEndpoint().getEndpoints();
		assert.strictEqual(httpEndpoints.length, 1);
		assert.strictEqual(httpEndpoints[0].endpoint, HTTP_ENDPOINT_URL);

		const fileEndpoints = fileEndpointConstructQuery.extractEndpoint().getEndpoints();
		assert.strictEqual(fileEndpoints.length, 1);
		assert.strictEqual(fileEndpoints[0].endpoint, FILE_ENDPOINT_URL);

		const noEndpoints = constructQuery.extractEndpoint().getEndpoints();
		assert.strictEqual(noEndpoints.length, 0);
	}
	);
});
