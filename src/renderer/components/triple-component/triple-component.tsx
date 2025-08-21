import { useEffect, useState } from 'react';

import { Term } from '../../model/sparql-result-json.model';
import { prefix } from '../../prefix.class';
import { UriComponent } from '../uri-component/uri-component';
import { LiteralComponent } from '../literal-component/literal-component';
import { BNodeComponent } from '../bnode-component/bnode-component';
import './triple-component.css';

interface TripleTermValue {
    subject: Term;
    predicate: Term;
    object: Term;
}
interface TripleComponentProps {
    term: Term;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const TripleComponent: React.FC<TripleComponentProps> = ({ term }) => {
    const [tripleTerm, setTripleTerm] = useState<Term[] | null>(null);

    useEffect(() => {
        if (term && term.value) {
            if (term.type !== 'triple') {
                throw new Error('Term is not a triple');
            }

            const tripleTermValue = term.value as unknown as TripleTermValue;
            const sTerm = tripleTermValue.subject;
            const pTerm = tripleTermValue.predicate;
            const oTerm = tripleTermValue.object;

            setTripleTerm([sTerm, pTerm, oTerm]);
            return;
        }
        setTripleTerm(null);
    }, [term]);

    return (
        <div className="triple-component" style={{ display: 'flex', flexDirection: 'row' }}>
            {tripleTerm &&
                tripleTerm.map((t, idx) => {
                    if (t.type === 'uri') {
                        return <UriComponent key={idx} term={t} />;
                    }
                    if (t.type === 'literal') {
                        return <LiteralComponent key={idx} term={t} />;
                    }
                    if (t.type === 'triple') {
                        return <TripleComponent key={idx} term={t} />;
                    }
                    if (t.type === 'bnode') {
                        return <BNodeComponent key={idx} term={t} />;
                    }
                    return null;
                })
            }
        </div>
    );
};
