import { getAcceptHeader, getContentTypeHeader } from '../sparql-utils';
import { Endpoint, SimpleHttpResponse } from '../endpoint';
import { SparqlQuery } from '../model/sparql-query';
import { MimeType } from '../../const/enum/mime-type';

/**
 * Represents an HTTP SPARQL endpoint.
 */
export class HttpEndpoint extends Endpoint {
  private _url: string;
  private _user: string;
  private _password: string;

  /**
   * Creates a new instance of the HttpEndpoint class.
   * @param endpointUrl - The URL of the SPARQL endpoint.
   * @param user - The username for authentication.
   * @param password - The password for authentication.
   */
  constructor(endpointUrl: string, user: string, password: string) {
    super();
    this._url = endpointUrl;
    this._user = user;
    this._password = password;
  }

  get url(): string {
    return this._url;
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

    // Basic Auth if needed
    if (this._user && this._password) {
      const encoded = Buffer.from(`${this._user}:${this._password}`).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
    }

    if (execution) {
      execution.token.onCancellationRequested((_: any) => {
        console.warn('Request cancelled');
        abortController.abort();
      });
    }

    console.log('Executing SPARQL query (fetch):', { url: this._url, headers });

    let response: Response;
    try {
      response = await fetch(this._url, {
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
    let mimeType: MimeType | undefined;
    if (mimeTypeStr.includes(MimeType.sparqlResultsJson)) {
      mimeType = MimeType.sparqlResultsJson;
    } else if (mimeTypeStr.includes(MimeType.sparqlResultsXml)) {
      mimeType = MimeType.sparqlResultsXml;
    } else if (mimeTypeStr.includes(MimeType.turtle)) {
      mimeType = MimeType.turtle;
    } else if (mimeTypeStr.includes(MimeType.ntriples)) {
      mimeType = MimeType.ntriples;
    } else if (mimeTypeStr.includes(MimeType.ntriples)) {
      mimeType = MimeType.ntriples;
    } else if (mimeTypeStr.includes(MimeType.json)) {
      mimeType = MimeType.json;
    } else if (mimeTypeStr.includes(MimeType.sparqlResultsCsv)) {
      mimeType = MimeType.sparqlResultsCsv;
    } else if (mimeTypeStr.includes(MimeType.sparqlResultsTsv)) {
      mimeType = MimeType.sparqlResultsTsv;
    } else {
      console.warn('Unknown MIME type:', mimeTypeStr);
      mimeType = undefined;
    }

    if (mimeType !== acceptContentType) {
      console.warn(`Content-Type mismatch: expected ${acceptContentType}, got ${mimeType}`);
    }

    const data = await response.text();


    const httpResponse: SimpleHttpResponse = {
      headers: { "content-type": mimeType ?? MimeType.plainText },
      data,
      status: response.status,
      statusText: response.statusText
    };
    return httpResponse;
  }



}
