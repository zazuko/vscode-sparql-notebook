import { NotebookCellOutputItem } from "vscode";

/**
 * Writes a JSON string as a NotebookCellOutputItem formatted in Markdown.
 * Markdown is used for syntax highlighting in the notebook output.
 * 
 * @param jsonResult The JSON string to be formatted.
 * @returns A NotebookCellOutputItem containing the formatted JSON string as Markdown.
 */
export function writeJson(jsonResult: string): NotebookCellOutputItem {
    return NotebookCellOutputItem.text(
        `\`\`\`json\n${jsonResult}\n\`\`\``,
        "text/markdown"
    );
}