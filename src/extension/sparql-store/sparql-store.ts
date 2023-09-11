import { Store, defaultGraph, NamedNode, BlankNode, Literal, namedNode } from 'oxigraph';
import { SPARQLQueryKind, getSPARQLQueryKind } from '../endpoint/sparql-utils';
import { SparqlResultJson } from '../endpoint/model/sparql-result-json';

export enum RdfMimeType {
    nTriples = 'application/n-triples',
    turtle = 'text/turtle',
    rdfXML = 'application/rdf+xml',
    trig = 'application/trig',
    nQuads = 'application/n-quads',
}
export class SparqlStore {
    private store: Store;

    constructor() {
        this.store = new Store();
    }

    public async query(query: string): Promise<any> {
        // Executes a SPARQL 1.1 Query. 
        // For SELECT queries the return type is an array of Map which keys are the bound variables and values are the values the result is bound to. 
        // For CONSTRUCT and DESCRIBE queries the return type is an array of Quad. 
        // For ASK queries the return type is a boolean.

        const queryKind = getSPARQLQueryKind(query);
        console.log('queryKind', queryKind);

        if (queryKind === SPARQLQueryKind.ask) {
            const res = await this._ask(query);
            const fakeHttpResult = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                headers: { "content-type": "application/sparql-results+json" },
                data: res
            };
            return fakeHttpResult;
        } else if (queryKind === SPARQLQueryKind.select) {
            const res = await this._select(query);
            const fakeHttpResult = {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                headers: { "content-type": "application/sparql-results+json" },
                data: res
            };
            return fakeHttpResult;
        } else if (queryKind === SPARQLQueryKind.construct || queryKind === SPARQLQueryKind.describe) {
            return await this._construct(query);
        }
        return await this.store.query(query);
    }

    private async _construct(query: string): Promise<any> {
        const ttl = (new Store(this.store.query(query))).dump(RdfMimeType.turtle, defaultGraph());
        const fakeHttpResult = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { "content-type": RdfMimeType.turtle },
            data: ttl
        };
        return fakeHttpResult;
    }

    private async _ask(query: string): Promise<SparqlResultJson> {
        const result = await this.store.query(query) as boolean;
        // turn this boolean to starqlresult+json
        return {
            "head": {
                "vars": []
            },
            "boolean": result
        };
    }

    private async _select(query: string): Promise<SparqlResultJson> {
        const resultMaps = await this.store.query(query) as Map<string, any>[];
        console.log(resultMaps);
        const sparqlResultJson: SparqlResultJson = {
            head: {
                vars: []
            },
            results: {
                bindings: []
            }
        };

        // Get the variable names from the first map
        const variableNames: string[] = [];
        const seenKeys = new Set<string>();
        for (const resultMap of resultMaps) {
            for (const key of resultMap.keys()) {
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    variableNames.push(key);
                }
            }
        };
        sparqlResultJson.head.vars = variableNames;

        // Convert each map to a binding object
        for (let resultMap of resultMaps) {
            const binding: any = {};
            for (let variableName of variableNames) {
                const term = resultMap.get(variableName);
                if (!term) {
                    continue;
                }
                if (term.termType === 'NamedNode') {
                    binding[variableName] = {
                        type: "uri",
                        value: term.value
                    };
                } else if (term.termType === 'BlankNode') {
                    binding[variableName] = {
                        type: "bnode",
                        value: term.value
                    };
                } else if (term.termType === 'Literal') {
                    const t = {} as any;
                    t.type = 'literal';
                    t.value = term.value;
                    if (term.datatype) {
                        if (term.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string' && term.datatype.value !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString') {
                            t.datatype = term.datatype.value;
                        }
                    }
                    if (term.language) {
                        t['xml:lang'] = term.language;
                    }
                    binding[variableName] = t;
                }
            }
            sparqlResultJson.results!.bindings.push(binding);



        }
        return sparqlResultJson;
    }

    public async update(query: string): Promise<any> {
        return await this.store.update(query);
    }

    public load(rdfString: string, mimeType: RdfMimeType): void {
        return this.store.load(rdfString, mimeType, null, defaultGraph());
    }

    public async dump(mimeType: RdfMimeType): Promise<any> {
        return await this.store.dump(mimeType, defaultGraph());
    }

    public get size(): number {
        return this.store.size;
    }

}
