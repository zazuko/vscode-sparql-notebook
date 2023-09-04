import { useEffect, useState } from 'react';

import { Term } from '../../model/sparql-result-json.model';

interface BNodeComponentProps {
    term: Term;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const BNodeComponent: React.FC<BNodeComponentProps> = ({ term }) => {
    const [blankNode, setBlankNode] = useState<BlankNode | null>(null);

    useEffect(() => {
        if (term && term.value) {
            if (term.type !== 'bnode') {
                throw new Error('Term is not a blank node');
            }

            const value = term.value;


            const bNode: BlankNode = {
                value
            };

            setBlankNode(bNode);
            return;
        }
        setBlankNode(null);
    }, [term]);


    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <span>[{blankNode?.value}]</span>
        </div>
    );
};

interface BlankNode {
    value: string;
}