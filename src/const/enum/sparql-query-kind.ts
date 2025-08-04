export enum SPARQLQueryKind {
    select = 'select',
    construct = 'construct',
    describe = 'describe',
    ask = 'ask',
    insert = 'insert',
    delete = 'delete',
    load = 'load',
    clear = 'clear',
    drop = 'drop',
    create = 'create',
    json = 'json', // fuski has that
    unknown = 'unknown'
}