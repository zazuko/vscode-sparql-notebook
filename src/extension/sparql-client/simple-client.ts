import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getSPARQLQueryKind, getAcceptHeader } from './sparql-utils';

export class SparqlClient {
  private endpoint: AxiosInstance;

  constructor(endpointUrl: string, user: string, password: string) {
    this.endpoint = axios.create({
      baseURL: endpointUrl,
      auth: {
        username: user,
        password: password,
      },
    });
  }

  public async query(sparqlQuery: string, execution?: any) {
    const params = new URLSearchParams();
    params.append("query", sparqlQuery);

    const queryKind = getSPARQLQueryKind(sparqlQuery);
    const abortController = new AbortController();

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
        console.log('kill', abortController);

      });
    }
    const response = await this.endpoint.post('', params, options);
    return response;
  }
}
