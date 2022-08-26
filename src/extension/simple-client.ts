const axios = require("axios").default;

export class SparqlClient {
  private endpoint = axios.create({
    baseURL: "https://int.lindas.admin.ch/query",
    //  timeout: 1000,
    //  headers: { "X-Custom-Header": "foobar" },
  });
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

  public async query(sparqlQuery: string) {
    const params = new URLSearchParams();
    params.append("query", sparqlQuery);
    const config = {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/x-www-form-urlencoded",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Accept: "application/sparql-results+json,text/turtle",
      },
    };
    const response = await this.endpoint.post("", params, config);
    return response;
  }
}
