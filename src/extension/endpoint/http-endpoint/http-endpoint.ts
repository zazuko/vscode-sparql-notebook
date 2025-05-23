import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import { getAcceptHeader, getContentTypeHeader } from '../sparql-utils';
import { Endpoint, SimpleHttpResponse } from '../endpoint';
import { SparqlQuery } from '../model/sparql-query';
import { MimeType } from '../../enum/mime-type';

/**
 * Represents an HTTP SPARQL endpoint.
 */
export class HttpEndpoint extends Endpoint {
  private http: AxiosInstance;
  private _url: string;

  /**
   * Creates a new instance of the HttpEndpoint class.
   * @param endpointUrl - The URL of the SPARQL endpoint.
   * @param user - The username for authentication.
   * @param password - The password for authentication.
   */
  constructor(endpointUrl: string, user: string, password: string) {
    super();
    console.log(user, password);
    debugger;
    this._url = endpointUrl;
    const axiosConfig: AxiosRequestConfig = {
      baseURL: endpointUrl,
    };
    if (user && password) {
      axiosConfig.auth = {
        username: user,
        password: password,
      };
    }
    this.http = axios.create(axiosConfig);
  }

  get url(): string {
    return this._url;
  }

  /**
   * Executes a SPARQL query against the endpoint.
   * @param sparqlQuery - The SPARQL query to execute.
   * @param execution - The execution object.
   */
  public async query(sparqlQuery: SparqlQuery, execution?: any): Promise<SimpleHttpResponse> {
    const abortController = new AbortController();
    const queryKind = sparqlQuery.kind;

    const options: AxiosRequestConfig = {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': getContentTypeHeader(queryKind),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Accept: getAcceptHeader(queryKind),
      },
      signal: abortController.signal
    };
    if (execution) {
      execution.token.onCancellationRequested((_: any) => {
        console.warn('Request cancelled');
        abortController.abort();
      });
    }
    const response = await this.http.post('', sparqlQuery.queryString, options);
    const mimeType = response.headers['content-type'];

    const httpResponse: SimpleHttpResponse = {
      headers: { "content-type": mimeType },
      data: typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    };
    return httpResponse;
  }

}
