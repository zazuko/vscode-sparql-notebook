import { expand, shrink } from '@zazuko/prefixes';
import prefixes from '@zazuko/prefixes';
import { PrefixMap } from './model/sparql-result-json.model';

class Prefixes {
    #prefixes = prefixes;
    #loadedKeys: string[] = [];

    private _add(prefix: string, uri: string) {
        this.#prefixes[prefix] = uri;
    }

    loadMap(prefixes: PrefixMap) {
        const loadedKeys = Object.keys(prefixes);

        // delete all old keys
        this.#loadedKeys.forEach(key => {
            delete this.#prefixes[key];
        });

        this.#loadedKeys = loadedKeys;

        Object.keys(prefixes).forEach(prefix => {
            this._add(prefix, prefixes[prefix]);
        });
    }

    clear() {

    }

    shrink(uri: string): string {
        return shrink(uri, this.#prefixes);
    }

    expand(curie: string): string {
        return expand(curie);
    }
}

export const prefix = new Prefixes();