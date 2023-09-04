import { ActivationFunction, OutputItem } from 'vscode-notebook-renderer';
import { SparqlResultJsonComponent } from './components/sparql-result-json-component/sparql-json-result-component';
import { SparqlAskResultComponent } from './components/sparql-result-ask-component/sparql-ask-result-component';

import { createRoot } from 'react-dom/client';

export const activate: ActivationFunction = () => ({
  renderOutputItem(outputItem: OutputItem, element: HTMLElement) {
    const root = createRoot(element);
    if (outputItem.json().hasOwnProperty("boolean")) {
      root.render(<SparqlAskResultComponent sparqlAsResult={outputItem.json()} />);
    } else {
      root.render(<SparqlResultJsonComponent sparqlResult={outputItem.json()} />);
    }
  },
});
