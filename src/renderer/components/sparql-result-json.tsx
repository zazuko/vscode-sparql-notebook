import { h, FunctionComponent } from 'preact';
import './sparql-result-json.css';
import { SparqlResultJson } from '../model/sparql-result-json.model';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const SparqlResultJsonOld: FunctionComponent<{
  sparqlResult: SparqlResultJson;
}> = ({ sparqlResult }) => (
  <table>
    <tr>
      {sparqlResult.head.vars.map((heading: string) => (
        <th>{heading}</th>
      ))}
    </tr>
    {sparqlResult.results.bindings.map((result: any) => (
      <tr>
        {sparqlResult.head.vars.map((heading: string) => (
          <td>
            {result[heading]?.value?.replaceAll("<", "&lt;")?.replaceAll(">", "&gt;") ?? ""}
          </td>
        ))}
      </tr>
    ))}
  </table>
);
