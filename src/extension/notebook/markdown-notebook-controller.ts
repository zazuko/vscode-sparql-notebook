import { NotebookCell, NotebookController, NotebookDocument, notebooks, workspace } from 'vscode';
import { NotebookCellExecutor } from './notebook-cell-executor';

export const markdownNotebookType = "sparql-markdown-notebook";

/**
 * Controller for executing SPARQL and SHACL code blocks in markdown files.
 *
 * This controller handles the execution of code cells when markdown files
 * are opened as SPARQL Markdown Notebooks.
 */
export class MarkdownNotebookController {
    readonly controllerId = `${markdownNotebookType}-controller-id`;
    readonly notebookType = markdownNotebookType;
    readonly label = "SPARQL Markdown Notebook";
    readonly supportedLanguages = ["sparql", "shacl"];

    readonly #controller: NotebookController;
    readonly #executor: NotebookCellExecutor;
    #executionOrder = 0;

    constructor() {
        // Check if markdown integration is enabled
        const config = workspace.getConfiguration("sparqlbook");
        const isEnabled = config.get("markdownIntegration.enabled", true);

        // Create a new notebook controller
        this.#controller = notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.label
        );

        // controller setup
        this.#controller.supportedLanguages = this.supportedLanguages;
        this.#controller.supportsExecutionOrder = true;
        this.#controller.description = "Execute SPARQL and SHACL queries from markdown code blocks";

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
