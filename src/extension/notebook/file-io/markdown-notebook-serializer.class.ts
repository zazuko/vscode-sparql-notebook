import * as vscode from "vscode";
import { TextDecoder, TextEncoder } from "util";

/**
 * Interface representing a parsed markdown section
 */
interface MarkdownSection {
    type: 'markdown' | 'code';
    content: string;
    language?: string;
}

/**
 * Markdown Notebook Serializer
 *
 * This class is responsible for serializing and deserializing markdown files as notebooks.
 * It parses markdown content and converts fenced code blocks with 'sparql' or 'shacl'
 * language identifiers into executable code cells.
 */
export class MarkdownNotebookSerializer implements vscode.NotebookSerializer {

    /**
     * Parses markdown content into sections (markdown text and code blocks)
     *
     * @param content - The raw markdown content
     * @returns Array of parsed sections
     */
    private parseMarkdown(content: string): MarkdownSection[] {
        const sections: MarkdownSection[] = [];
        const lines = content.split(/\r?\n/);

        let currentMarkdown: string[] = [];
        let currentCode: string[] = [];
        let inCodeBlock = false;
        let codeLanguage = '';

        for (const line of lines) {
            // Check for code fence start
            const codeFenceStart = line.match(/^```(\w*)$/i);

            if (codeFenceStart && !inCodeBlock) {
                // Save any accumulated markdown
                if (currentMarkdown.length > 0) {
                    const markdownContent = currentMarkdown.join('\n').trim();
                    if (markdownContent) {
                        sections.push({
                            type: 'markdown',
                            content: markdownContent
                        });
                    }
                    currentMarkdown = [];
                }

                inCodeBlock = true;
                codeLanguage = codeFenceStart[1].toLowerCase();
                currentCode = [];
            } else if (line.match(/^```$/) && inCodeBlock) {
                // End of code block
                const codeContent = currentCode.join('\n');

                // Only create code cells for SPARQL and SHACL
                if (codeLanguage === 'sparql' || codeLanguage === 'shacl') {
                    sections.push({
                        type: 'code',
                        content: codeContent,
                        language: codeLanguage
                    });
                } else {
                    // For other languages, keep as markdown with the fence
                    const fencedCode = '```' + codeLanguage + '\n' + codeContent + '\n```';
                    sections.push({
                        type: 'markdown',
                        content: fencedCode
                    });
                }

                inCodeBlock = false;
                codeLanguage = '';
                currentCode = [];
            } else if (inCodeBlock) {
                currentCode.push(line);
            } else {
                currentMarkdown.push(line);
            }
        }

        // Handle any remaining content
        if (inCodeBlock) {
            // Unclosed code block - treat as markdown
            const unclosedBlock = '```' + codeLanguage + '\n' + currentCode.join('\n');
            currentMarkdown.push(unclosedBlock);
        }

        if (currentMarkdown.length > 0) {
            const markdownContent = currentMarkdown.join('\n').trim();
            if (markdownContent) {
                sections.push({
                    type: 'markdown',
                    content: markdownContent
                });
            }
        }

        return sections;
    }

    /**
     * Implementation of the deserializeNotebook method.
     * Converts markdown content into notebook cells.
     *
     * @param content - The raw file content
     * @param _token - Cancellation token
     * @returns NotebookData with parsed cells
     */
    async deserializeNotebook(
        content: Uint8Array,
        _token: vscode.CancellationToken
    ): Promise<vscode.NotebookData> {
        const markdownContent = new TextDecoder().decode(content);
        const sections = this.parseMarkdown(markdownContent);

        const cells: vscode.NotebookCellData[] = sections.map(section => {
            if (section.type === 'code') {
                return new vscode.NotebookCellData(
                    vscode.NotebookCellKind.Code,
                    section.content,
                    section.language || 'sparql'
                );
            } else {
                return new vscode.NotebookCellData(
                    vscode.NotebookCellKind.Markup,
                    section.content,
                    'markdown'
                );
            }
        });

        return new vscode.NotebookData(cells);
    }

    /**
     * Implementation of the serializeNotebook method.
     * Converts notebook cells back to markdown format.
     *
     * @param data - The notebook data to serialize
     * @param _token - Cancellation token
     * @returns Serialized markdown content
     */
    async serializeNotebook(
        data: vscode.NotebookData,
        _token: vscode.CancellationToken
    ): Promise<Uint8Array> {
        const parts: string[] = [];

        for (const cell of data.cells) {
            if (cell.kind === vscode.NotebookCellKind.Code) {
                // Wrap code cells in fenced code blocks
                const language = cell.languageId || 'sparql';
                parts.push('```' + language);
                parts.push(cell.value);
                parts.push('```');
                parts.push(''); // Empty line after code block
            } else {
                // Markup cells are added as-is
                parts.push(cell.value);
                parts.push(''); // Empty line after markdown section
            }
        }

        // Join with newlines and trim trailing whitespace
        const markdown = parts.join('\n').replace(/\n+$/, '\n');

        return new TextEncoder().encode(markdown);
    }
}
