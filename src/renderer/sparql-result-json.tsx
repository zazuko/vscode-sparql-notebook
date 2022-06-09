// the MIME-Type is application/sparql-results+json"

import { ActivationFunction, OutputItem } from 'vscode-notebook-renderer';
import { h, render } from 'preact';
import { SparqlResultJson } from './components/sparql-result-json';
import { SparqlAskResultJson } from './components/sparql-ask-result-json';

export const activate: ActivationFunction = () => ({
  renderOutputItem(outputItem: OutputItem, element: HTMLElement) {
    if (outputItem.json().hasOwnProperty("boolean")) {
      render(<SparqlAskResultJson sparqlResult={outputItem.json()} />, element);
    } else {
      render(<SparqlResultJson sparqlResult={outputItem.json()} />, element);
    }
  },
});