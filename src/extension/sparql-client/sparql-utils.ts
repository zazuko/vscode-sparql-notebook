export enum SPARQLQueryKind {
    select = 'select',
    construct = 'construct',
    describe = 'describe',
    ask = 'ask',
    update = 'update',
    load = 'load',
    clear = 'clear',
    drop = 'drop',
    create = 'create',
    json = 'json'// fuski has that
}

export function getSPARQLQueryKind(query: string): SPARQLQueryKind {
    const lines = query.split('\n').map(line => line.trim().toLowerCase());
    const linesWithoutCommentsAndEmpty = lines.filter(line => line !== '' && !line.startsWith('#'));
    const linesWithoutPrefix = linesWithoutCommentsAndEmpty.filter(line => {
        return !line.startsWith('prefix');
    });
    const firstLine = linesWithoutPrefix[0];
    if (firstLine !== undefined) {
        if (firstLine.startsWith(SPARQLQueryKind.select)) {
            return SPARQLQueryKind.select;
        } else if (firstLine.startsWith(SPARQLQueryKind.construct)) {
            return SPARQLQueryKind.construct;
        } else if (firstLine.startsWith(SPARQLQueryKind.describe)) {
            return SPARQLQueryKind.describe;
        } else if (firstLine.startsWith(SPARQLQueryKind.ask)) {
            return SPARQLQueryKind.ask;
        } else if (firstLine.startsWith(SPARQLQueryKind.update)) {
            return SPARQLQueryKind.update;
        } else if (firstLine.startsWith(SPARQLQueryKind.load)) {
            return SPARQLQueryKind.load;
        } else if (firstLine.startsWith(SPARQLQueryKind.clear)) {
            return SPARQLQueryKind.clear;
        } else if (firstLine.startsWith(SPARQLQueryKind.drop)) {
            return SPARQLQueryKind.drop;
        } else if (firstLine.startsWith(SPARQLQueryKind.create)) {
            return SPARQLQueryKind.create;
        } else if (firstLine.startsWith(SPARQLQueryKind.json)) {
            return SPARQLQueryKind.json;
        }
    }
    throw new Error('Unknown query type');
}




export function getAcceptHeader(queryType: SPARQLQueryKind): string {
    switch (queryType) {
        case SPARQLQueryKind.ask:
        case SPARQLQueryKind.select:
            return 'application/sparql-results+json';
        case SPARQLQueryKind.construct:
        case SPARQLQueryKind.describe:
            return 'text/turtle';
        case SPARQLQueryKind.update:
        case SPARQLQueryKind.load:
        case SPARQLQueryKind.clear:
        case SPARQLQueryKind.drop:
        case SPARQLQueryKind.create:
            return '*/*';
        case SPARQLQueryKind.json:
            return 'application/json';
        default:
            throw new Error('Unknown query type');
    }
}