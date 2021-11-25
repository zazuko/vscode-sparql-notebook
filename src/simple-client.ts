const axios = require("axios").default;

export class SparqlClient {
  static endpoint = axios.create({
    baseURL: "https://int.lindas.admin.ch/query",
    //  timeout: 1000,
    //  headers: { "X-Custom-Header": "foobar" },
  });

  static async select(sparqlQuery: string) {
    try {
      const params = new URLSearchParams();
      params.append("query", sparqlQuery);
      const config = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/sparql-results+json",
        },
      };
      const response = await this.endpoint.post("/", params, config);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }
}
