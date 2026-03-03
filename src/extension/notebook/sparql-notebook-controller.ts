import { NotebookCell, NotebookController, NotebookDocument, notebooks } from 'vscode';
import { extensionId } from "../extension";
import { NotebookCellExecutor } from './notebook-cell-executor';

export class SparqlNotebookController {
  readonly controllerId = `${extensionId}-controller-id`;
  readonly notebookType = extensionId;
  readonly label = "Sparql Notebook";
  readonly supportedLanguages = ["sparql", "shacl"];

  readonly #controller: NotebookController;
  readonly #executor: NotebookCellExecutor;
  #executionOrder = 0;

  constructor() {
    // Create a new notebook controller
    this.#controller = notebooks.createNotebookController(
      this.controllerId,
      this.notebookType,
      this.label
    );

    // controller setup
    this.#controller.supportedLanguages = this.supportedLanguages;
    this.#controller.supportsExecutionOrder = true;

    // Initialize the shared executor
    this.#executor = new NotebookCellExecutor();

    // this is executing the cells
    this.#controller.executeHandler = this.#execute.bind(this);
  }

  /**
   * Executes the given cells by calling the executor for each cell.
   * @param cells - The cells to execute.
   * @param _notebook - The notebook document containing the cells.
   * @param _controller - The notebook controller for the notebook document.
   */
  #execute(cells: NotebookCell[], _notebook: NotebookDocument, _controller: NotebookController): void {
    for (let cell of cells) {
      this.#executeCell(cell);
    }
  }

  async #executeCell(nbCell: NotebookCell): Promise<void> {
    const execution = this.#controller.createNotebookCellExecution(nbCell);
    execution.executionOrder = ++this.#executionOrder;
    execution.start(Date.now());

    await this.#executor.executeCell(nbCell, execution);
  }

  dispose() {
    this.#controller.dispose();
  }
}
