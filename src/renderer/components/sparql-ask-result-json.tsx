import { h, FunctionComponent } from 'preact';
import './sparql-result-json.css';
import { SparqlAskResult } from '../model/sparql-result-json.model';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SparqlAskResultJson: FunctionComponent<{
  sparqlResult: SparqlAskResult;
}> = ({ sparqlResult }) => (
  <table>
    <tr>
        <td>{sparqlResult.boolean ? 'yes': 'no'}</td>
    </tr>
  </table>
);
