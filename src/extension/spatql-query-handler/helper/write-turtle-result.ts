import { NotebookCellOutput, NotebookCellOutputItem } from "vscode";
import { MimeType } from "../../const/enum/mime-type";

/**
 * Creates a NotebookCellOutput containing a Turtle result.
 * The output includes:
 * 1. The Turtle result as plain text.
 * 2. A Markdown-formatted Turtle code block for syntax highlighting.
 * 3. The Turtle result as a NotebookCellOutputItem with MIME type 'text/turtle'.
 * 
 * @param resultTTL The Turtle result string to be formatted.
 * @returns A NotebookCellOutput containing the formatted Turtle result.
 */
export function writeTurtleResult(resultTTL: string): NotebookCellOutput {
    // Create a NotebookCellOutput with multiple items:
    return new NotebookCellOutput([

        NotebookCellOutputItem.text(resultTTL, MimeType.plainText),
        NotebookCellOutputItem.text(
            `\`\`\`turtle\n${resultTTL}\n\`\`\``,
            "text/markdown"
        ),
        NotebookCellOutputItem.text(resultTTL, MimeType.turtle),

    ]);
}