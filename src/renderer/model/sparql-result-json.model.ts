export interface SparqlAskResult {
  boolean: boolean;
}

export interface SparqlJsonResult {
  head: {
    vars: string[];
  };
  results: {
    bindings: any[];
  };
}
