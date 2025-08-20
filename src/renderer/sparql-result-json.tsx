import { ActivationFunction, OutputItem } from 'vscode-notebook-renderer';
import { SparqlResultJsonComponent } from './components/sparql-result-json-component/sparql-json-result-component';
import { SparqlAskResultComponent } from './components/sparql-result-ask-component/sparql-ask-result-component';

import { createRoot } from 'react-dom/client';
import { prefix } from './prefix.class';

function injectRendererCss() {
  const id = 'sparql-notebook-renderer-css';
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    // Path is relative to the renderer JS file
    link.href = new URL('./sparql-result-json.css', import.meta.url).toString();
    document.head.appendChild(link);
  }
}

export const activate: ActivationFunction = () => {
    injectRendererCss();
   return {
  renderOutputItem(outputItem: OutputItem, element: HTMLElement) {
    const root = createRoot(element);
    if (outputItem.json().hasOwnProperty("boolean")) {
      root.render(<SparqlAskResultComponent sparqlAsResult={outputItem.json()} />);
    } else {
      const prefixMap = (outputItem.metadata as any)?.prefixMap ?? {};
      prefix.loadMap(prefixMap);
      root.render(<SparqlResultJsonComponent sparqlResult={outputItem.json()} />);
    }
  },
}};


