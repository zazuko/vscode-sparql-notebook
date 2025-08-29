import { getAcceptHeader, getContentTypeHeader } from '../sparql-utils';
import { Endpoint, SimpleHttpResponse } from '../endpoint';
import { SparqlQuery } from '../model/sparql-query';
import { MimeType } from '../../const/enum/mime-type';

/**
 * Represents an HTTP SPARQL endpoint.
 */
export class HttpEndpoint extends Endpoint {
  #url: string;
  #user: string;
  #password: string;
  readonly isQLeverEndpoint: boolean;

  /**
   * Creates a new instance of the HttpEndpoint class.
   * @param endpointUrl - The URL of the SPARQL endpoint.
   * @param user - The username for authentication.
   * @param password - The password for authentication.
   */
  constructor(endpointUrl: string, user: string, password: string, isQLever: boolean = false) {
    super();
    this.#url = endpointUrl;
    this.#user = user;
    this.#password = password;
    this.isQLeverEndpoint = isQLever;
  }

  get url(): string {
    return this.#url;
  }

  /**
   * Executes a SPARQL query against the endpoint using fetch.
   * @param sparqlQuery - The SPARQL query to execute.
   * @param execution - The execution object.
   */
  public async query(sparqlQuery: SparqlQuery, execution?: any): Promise<SimpleHttpResponse> {
    const abortController = new AbortController();
    const queryKind = sparqlQuery.kind;
    const contentType = getContentTypeHeader(queryKind);
    const acceptContentType = getAcceptHeader(queryKind);
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      Accept: acceptContentType,
    };

    // QLever specific headers
    if (sparqlQuery.isUpdateQuery && this.isQLeverEndpoint) {
      headers['Authorization'] = `Bearer ${this.#password}`;
    }

    // Basic Auth if needed
    if (this.#user && this.#password) {
      const encoded = Buffer.from(`${this.#user}:${this.#password}`).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
    }

    if (execution) {
      execution.token.onCancellationRequested((_: any) => {
        console.warn('Request cancelled');
        abortController.abort();
      });
    }

    console.log('Executing SPARQL query (fetch):', { url: this.#url, headers });

    let response: Response;
    try {
      response = await fetch(this.#url, {
        method: 'POST',
        headers,
        body: sparqlQuery.queryString,
        signal: abortController.signal,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Request was aborted');
      }
      throw err;
    }

    const mimeTypeStr = response.headers.get('content-type') || '';



    console.log('SPARQL query response:', response.status, response.statusText, mimeTypeStr);
    const data = await response.text();

    if (this.isQLeverEndpoint && sparqlQuery.isUpdateQuery && response.status === 200) {

      const json = JSON.parse(data);
      const httpResponse: SimpleHttpResponse = {
        headers: { "content-type": MimeType.plainText },
        data: 'experimental',
        status: response.status,
        statusText: response.statusText
      };
      return httpResponse;

    }

    const httpResponse: SimpleHttpResponse = {
      headers: { "content-type": mimeTypeStr.split(';')[0] },
      data,
      status: response.status,
      statusText: response.statusText
    };
    return httpResponse;
  }



}
