import { useEffect, useState } from 'react';

import { Term } from '../../model/sparql-result-json.model';
import { prefix } from '../../prefix.class';

import './uri-component.css';

interface UriComponentProps {
    term: Term;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const UriComponent: React.FC<UriComponentProps> = ({ term }) => {
    const [uri, setUri] = useState<Uri | null>(null);
    const [isLinkClicked, setIsLinkClicked] = useState(false);

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
            return;
        }
        setUri(null);
    }, [term]);

    function handleLinkIconClick() {
        if (uri) {
            navigator.clipboard.writeText(uri.href);
            setIsLinkClicked(true);
            setTimeout(() => {
                setIsLinkClicked(false);
            }, 800);
        }

    };

    return (
        <div className="uri-component" style={{ display: 'flex', flexDirection: 'row' }}>
            <a className='sparql-notebook' href={uri?.href}>{(uri?.isPrefixed ? '' : '<') + uri?.value + (uri?.isPrefixed ? '' : '>')}</a>
            {isLinkClicked ? (
                <span title="copied" className="link-icon disappear">
                    📋
                </span>) : (
                <span title="click to copy iri" className="link-icon" onClick={handleLinkIconClick}>
                    🔗
                </span>
            )}
        </div>
    );
};

interface Uri {
    value: string;
    href: string;
    isPrefixed: boolean;
}