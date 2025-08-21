export interface SparqlResultJson {
  head: {
    vars: string[];
  };
  results?: {
    bindings: {
      [key: string]: Term;
    }[];
  },
  boolean?: boolean;
}

export type PrefixMap = {
  [key: string]: string;
};

export interface Term {
  type: 'uri' | 'bnode' | 'literal' | 'typed-literal' | 'triple';
  value: string;
  datatype?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "xml:lang"?: string;
};

