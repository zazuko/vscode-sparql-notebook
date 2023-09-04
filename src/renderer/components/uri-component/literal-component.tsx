import { useEffect, useState } from 'react';

import { Term } from '../../model/sparql-result-json.model';

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

            const uri: Uri = {
                value: term.value,
                href: term.value,
            };
            setUri(uri);
            return;
        }
        setUri(null);
    }, [term]);


    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <a href={uri?.href}>&lt;{uri?.value}&gt;</a>
        </div>
    );
};

interface Uri {
    value: string;
    href: string;
}