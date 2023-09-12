import { useEffect, useState } from 'react';

import { Term } from '../../model/sparql-result-json.model';

import { prefix } from '../../prefix.class';

import './literal-component.css';

interface LiteralComponentProps {
    term: Term;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const LiteralComponent: React.FC<LiteralComponentProps> = ({ term }) => {
    const [literal, setLiteral] = useState<Literal | null>(null);

    useEffect(() => {
        if (term && term.value) {
            if (term.type !== 'literal') {
                throw new Error('Term is not a literal');
            }
            let datatype = '';
            if (term.datatype) {
                const datatypeFromTerm: string = term.datatype;
                datatype = datatypeFromTerm.replace("http://www.w3.org/2001/XMLSchema#", "xsd:");
            }
            const literal: Literal = {
                datatype: datatype,
                value: term.value,
                languageTag: term['xml:lang'] ?? ''
            };
            setLiteral(literal);
            return;
        }
        setLiteral(null);
    }, [term]);


    return (
        <div className="row">
            <span title="Literal" className="value">{literal?.value}</span>
            <span className="meta">
                {' '}
                {literal?.languageTag ? '@' + literal.languageTag : ''}
            </span>
            {literal?.datatype && (
                <span className="meta">
                    {' '}
                    {literal?.datatype ? '^^' + literal.datatype : ''}
                </span>
            )}
        </div>
    );
};

interface Literal {
    datatype: string;
    value: string;
    languageTag: string;
}