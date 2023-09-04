import { expand, shrink } from '@zazuko/prefixes';
import prefixes from '@zazuko/prefixes';
import { PrefixMap } from './model/sparql-result-json.model';

class Prefixes {
    private _prefixes = prefixes;

    add(prefix: string, uri: string) {
        this._prefixes[prefix] = uri;
    }

    addPrefixMap(prefixes: PrefixMap) {
        Object.keys(prefixes).forEach(prefix => {
            this.add(prefix, prefixes[prefix]);
        });
    }

    shrink(uri: string): string {
        return shrink(uri, this._prefixes);
    }

    expand(curie: string): string {
        return expand(curie);
    }
}

export const prefix = new Prefixes();