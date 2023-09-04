import { expand, shrink } from '@zazuko/prefixes';
import prefixes from '@zazuko/prefixes';
import { PrefixMap } from './model/sparql-result-json.model';

class Prefixes {
    private _prefixes = prefixes;
    private _loadedKeys: string[] = [];

    private _add(prefix: string, uri: string) {
        this._prefixes[prefix] = uri;
    }

    loadMap(prefixes: PrefixMap) {
        const loadedKeys = Object.keys(prefixes);

        // delete all old keys
        this._loadedKeys.forEach(key => {
            delete this._prefixes[key];
        });

        this._loadedKeys = loadedKeys;

        Object.keys(prefixes).forEach(prefix => {
            this._add(prefix, prefixes[prefix]);
        });
    }

    clear() {

    }

    shrink(uri: string): string {
        return shrink(uri, this._prefixes);
    }

    expand(curie: string): string {
        return expand(curie);
    }
}

export const prefix = new Prefixes();