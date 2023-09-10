import { Store, defaultGraph } from 'oxigraph';

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
        return await this.store.query(query);
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