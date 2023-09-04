// the MIME-Type is application/sparql-results+json"

import { ActivationFunction, OutputItem } from 'vscode-notebook-renderer';
//import { h, render } from 'preact';
import { SparqlAskResultJson } from './components/sparql-ask-result-json';
import { SparqlResultJsonComponent } from './components/sparql-result-json-component/sparql-json-result-component';
import { render } from 'react-dom';

export const activate: ActivationFunction = () => ({
  renderOutputItem(outputItem: OutputItem, element: HTMLElement) {
    if (outputItem.json().hasOwnProperty("boolean")) {
      //   render(<SparqlAskResultJson sparqlResult={outputItem.json()} />, element);
    } else {
      render(<SparqlResultJsonComponent sparqlResult={outputItem.json()} />, element);
    }
  },
});
