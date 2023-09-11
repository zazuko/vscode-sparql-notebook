import { SparqlResultJson } from '../../model/sparql-result-json.model';
import { LiteralComponent } from '../literal-component/literal-component';
import { UriComponent } from '../uri-component/uri-component';
import { BNodeComponent } from '../bnode-component/bnode-component';

import './sparql-json-result-component.css';

interface SparqlResultJsonComponentProps {
    sparqlResult: SparqlResultJson;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SparqlResultJsonComponent: React.FC<SparqlResultJsonComponentProps> = ({ sparqlResult }) => {

    return (
        <table>
            <thead>
                <tr>
                    {sparqlResult.head.vars.map((heading: string, index: number) => (
                        <th key={index}>{heading}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {sparqlResult.results!.bindings.map((result: any, index: number) => (
                    <tr key={index}>
                        {sparqlResult.head.vars.map((heading: string, index: number) => (
                            <td key={index}>

                                {result[heading] === undefined ? (
                                    <div></div>
                                ) : result[heading]?.type === 'literal' ? (
                                    <LiteralComponent term={result[heading]} />
                                ) : result[heading]?.type === 'uri' ? (
                                    <UriComponent term={result[heading]} />
                                ) : result[heading]?.type === 'bnode' ? (
                                    <BNodeComponent term={result[heading]} />
                                ) : null ?? ''
                                }

                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

