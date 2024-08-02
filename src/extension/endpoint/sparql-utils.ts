import { SPARQLQueryKind } from "./enum/sparql-query-kind";


export function getSPARQLQueryKind(query: string): SPARQLQueryKind {
    const lines = query.split('\n').map(line => line.trim().toLowerCase());
    const linesWithoutCommentsAndEmpty = lines.filter(line => line !== '' && !line.startsWith('#'));
    const linesWithoutPrefix = linesWithoutCommentsAndEmpty.filter(line => {
        return !line.startsWith('prefix');
    });
    const lineWithQueryKind = linesWithoutPrefix.filter(line => {
        return line.startsWith(SPARQLQueryKind.select) ||
            line.startsWith(SPARQLQueryKind.construct) ||
            line.startsWith(SPARQLQueryKind.describe) ||
            line.startsWith(SPARQLQueryKind.ask) ||
            line.startsWith(SPARQLQueryKind.delete) ||
            line.startsWith(SPARQLQueryKind.insert) ||
            line.startsWith(SPARQLQueryKind.load) ||
            line.startsWith(SPARQLQueryKind.clear) ||
            line.startsWith(SPARQLQueryKind.drop) ||
            line.startsWith(SPARQLQueryKind.create) ||
            line.startsWith(SPARQLQueryKind.json);
    }
    );
    const firstLine = lineWithQueryKind[0];
    if (firstLine !== undefined) {
        if (firstLine.startsWith(SPARQLQueryKind.select)) {
            return SPARQLQueryKind.select;
        } else if (firstLine.startsWith(SPARQLQueryKind.construct)) {
            return SPARQLQueryKind.construct;
        } else if (firstLine.startsWith(SPARQLQueryKind.describe)) {
            return SPARQLQueryKind.describe;
        } else if (firstLine.startsWith(SPARQLQueryKind.ask)) {
            return SPARQLQueryKind.ask;
        } else if (firstLine.startsWith(SPARQLQueryKind.delete)) {
            return SPARQLQueryKind.delete;
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
        } else if (firstLine.startsWith(SPARQLQueryKind.insert)) {
            return SPARQLQueryKind.insert;
        }
    }
    return SPARQLQueryKind.unknown;
}




export function getAcceptHeader(queryType: SPARQLQueryKind): string {
    console.log('queryType', queryType);
    switch (queryType) {
        case SPARQLQueryKind.ask:
        case SPARQLQueryKind.select:
            return 'application/sparql-results+json';
        case SPARQLQueryKind.construct:
        case SPARQLQueryKind.describe:
            return 'text/turtle';
        case SPARQLQueryKind.insert:
        case SPARQLQueryKind.load:
        case SPARQLQueryKind.clear:
        case SPARQLQueryKind.drop:
        case SPARQLQueryKind.create:
            return '*/*';
        case SPARQLQueryKind.json:
            return 'application/json';
        default:
            throw new Error('Unknown query type' + queryType);
    }
}