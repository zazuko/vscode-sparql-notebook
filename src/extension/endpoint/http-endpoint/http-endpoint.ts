import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

import { getSPARQLQueryKind, getAcceptHeader } from '../sparql-utils';
import { Endpoint } from '../endpoint';
import { SparqlQuery } from '../model/sparql-query';

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
    this._url = endpointUrl;
    this.http = axios.create({
      baseURL: endpointUrl,
      auth: {
        username: user,
        password: password,
      },
    });
  }

  get url(): string {
    return this._url;
  }

  /**
   * Executes a SPARQL query against the endpoint.
   * @param sparqlQuery - The SPARQL query to execute.
   * @param execution - The execution object.
   */
  public async query(sparqlQuery: SparqlQuery, execution?: any) {
    const params = new URLSearchParams();
    params.append("query", sparqlQuery.queryString);

    const abortController = new AbortController();
    const queryKind = sparqlQuery.kind;

    const options: AxiosRequestConfig = {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/x-www-form-urlencoded',
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
    const response = await this.http.post('', params, options);
    return response;
  }

}
