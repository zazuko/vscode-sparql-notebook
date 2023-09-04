import { ActivationFunction, OutputItem } from 'vscode-notebook-renderer';
import { SparqlResultJsonComponent } from './components/sparql-result-json-component/sparql-json-result-component';
import { SparqlAskResultComponent } from './components/sparql-result-ask-component/sparql-ask-result-component';

import { render } from 'react-dom';

export const activate: ActivationFunction = () => ({
  renderOutputItem(outputItem: OutputItem, element: HTMLElement) {
    if (outputItem.json().hasOwnProperty("boolean")) {
      render(<SparqlAskResultComponent sparqlAsResult={outputItem.json()} />, element);
    } else {
      render(<SparqlResultJsonComponent sparqlResult={outputItem.json()} />, element);
    }
  },
});
