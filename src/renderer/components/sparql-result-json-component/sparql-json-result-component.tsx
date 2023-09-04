import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useState } from 'react';

import { SparqlResultJsonWithPrefixMap } from '../../model/sparql-result-json.model';
import { LiteralComponent } from '../literal-component/literal-component';
import { UriComponent } from '../uri-component/uri-component';

import './sparql-json-result-component.css';

interface SparqlResultJsonComponentProps {
    sparqlResult: SparqlResultJsonWithPrefixMap;
}


// eslint-disable-next-line @typescript-eslint/naming-convention
export const SparqlResultJsonComponent: React.FC<SparqlResultJsonComponentProps> = ({ sparqlResult }) => {
    const [showDatatype, setShowDatatype] = useState(false);

    const handleToggleDatatype = () => {
        console.log('handleToggleDatatype', JSON.stringify(sparqlResult));
        setShowDatatype(!showDatatype);
    };

    return (
        <>
            <VSCodeButton onClick={handleToggleDatatype}>Show Datatype</VSCodeButton>
            <table>
                <thead>
                    <tr>
                        {sparqlResult.head.vars.map((heading: string) => (
                            <th>{heading}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sparqlResult.results.bindings.map((result: any) => (
                        <tr>
                            {sparqlResult.head.vars.map((heading: string) => (
                                <td>
                                    {result[heading].type === 'literal' ? (
                                        <LiteralComponent term={result[heading]} />
                                    ) : result[heading].type === 'uri' ? (
                                        <UriComponent term={result[heading]} />
                                    ) : null ?? ''
                                    }

                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};

