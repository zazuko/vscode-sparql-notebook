import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class SparqlClient {
  private endpoint: AxiosInstance;
  // "https://int.lindas.admin.ch/query"

  constructor(endpointUrl: string, user: string, password: string) {
    this.endpoint = axios.create({
      baseURL: endpointUrl,
      //  timeout: 1000,
      //  headers: { "X-Custom-Header": "foobar" },
      auth: {
        username: user,
        password: password,
      },
    });
  }

  public async query(sparqlQuery: string, execution?: any) {
    const params = new URLSearchParams();
    params.append("query", sparqlQuery);

    const abortController = new AbortController();

    const options: AxiosRequestConfig = {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/x-www-form-urlencoded',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Accept: 'application/sparql-results+json,text/turtle',
      },
      signal: abortController.signal
    };
    if (execution) {
      execution.token.onCancellationRequested((_: any) => {
        console.warn('Request cancelled');
        const k = abortController.abort();
        console.log('kill', abortController);

      });
    }
    const response = await this.endpoint.post('', params, options);
    return response;
  }
}
