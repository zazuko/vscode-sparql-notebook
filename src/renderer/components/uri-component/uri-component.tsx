import { useEffect, useState } from 'react';

import { Term } from '../../model/sparql-result-json.model';
import { prefix } from '../../prefix.class';

interface UriComponentProps {
    term: Term;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const UriComponent: React.FC<UriComponentProps> = ({ term }) => {
    const [uri, setUri] = useState<Uri | null>(null);

    useEffect(() => {
        if (term && term.value) {
            if (term.type !== 'uri') {
                throw new Error('Term is not an uri');
            }

            const href = term.value;
            const prefixedValue = prefix.shrink(term.value);
            const value = prefixedValue.length > 0 ? prefixedValue : term.value;

            const isPrefixed = href !== value;

            const uri: Uri = {
                value,
                href,
                isPrefixed
            };

            setUri(uri);
            console.log(uri);
            return;
        }
        setUri(null);
    }, [term]);


    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <a href={uri?.href}>{(uri?.isPrefixed ? '' : '<') + uri?.value + (uri?.isPrefixed ? '' : '>')}</a>
        </div>
    );
};

interface Uri {
    value: string;
    href: string;
    isPrefixed: boolean;
}