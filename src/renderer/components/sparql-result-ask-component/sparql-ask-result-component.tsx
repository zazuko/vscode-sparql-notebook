import { SparqlAskResult } from '../../model/sparql-result-json.model';


interface SparqlAskResultComponentProps {
    sparqlAsResult: SparqlAskResult;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SparqlAskResultComponent: React.FC<SparqlAskResultComponentProps> = ({ sparqlAsResult }) => {
    return (
        <table>
            <tr>
                <td>{sparqlAsResult.boolean ? '✅ yes' : '❌ no'}</td>
            </tr>
        </table>
    );
};

