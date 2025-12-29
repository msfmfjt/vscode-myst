import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Register MyST-specific commands
    context.subscriptions.push(
        vscode.commands.registerCommand('myst.extension.insertDirective', insertDirective),
        vscode.commands.registerCommand('myst.extension.insertFigure', insertFigure),
        vscode.commands.registerCommand('myst.extension.insertCitation', insertCitation),
        vscode.commands.registerCommand('myst.extension.insertCrossReference', insertCrossReference),
        vscode.commands.registerCommand('myst.extension.insertEquation', insertEquation),
        vscode.commands.registerCommand('myst.extension.insertCodeCell', insertCodeCell)
    );
}

async function insertDirective() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const directiveType = await vscode.window.showQuickPick([
        { label: 'note', description: 'Information note' },
        { label: 'tip', description: 'Helpful tip' },
        { label: 'warning', description: 'Warning message' },
        { label: 'danger', description: 'Danger/error message' },
        { label: 'important', description: 'Important information' },
        { label: 'admonition', description: 'Custom admonition' },
        { label: 'figure', description: 'Figure with caption' },
        { label: 'table', description: 'Table with caption' },
        { label: 'code-block', description: 'Code block with syntax highlighting' },
        { label: 'code-cell', description: 'Executable code cell' },
        { label: 'math', description: 'Mathematical equation block' },
        { label: 'bibliography', description: 'Bibliography section' },
        { label: 'contents', description: 'Table of contents' },
        { label: 'glossary', description: 'Glossary of terms' }
    ], {
        placeHolder: 'Select a MyST directive to insert'
    });

    if (!directiveType) return;

    let snippet: string;
    switch (directiveType.label) {
        case 'note':
        case 'tip':
        case 'warning':
        case 'danger':
        case 'important':
            snippet = `\`\`\`{${directiveType.label}}\n\${1:Your ${directiveType.label} content here}\n\`\`\``;
            break;
        case 'admonition':
            snippet = `\`\`\`{admonition} \${1:Title}\n:class: \${2:note}\n\n\${3:Your content here}\n\`\`\``;
            break;
        case 'figure':
            snippet = `\`\`\`{figure} \${1:path/to/image.png}\n:name: \${2:fig-label}\n:width: \${3:400px}\n:alt: \${4:Alternative text}\n\n\${5:Caption text}\n\`\`\``;
            break;
        case 'table':
            snippet = `\`\`\`{table} \${1:Table title}\n:name: \${2:tbl-label}\n\n| \${3:Header 1} | \${4:Header 2} | \${5:Header 3} |\n|-------------|-------------|-------------|\n| \${6:Row 1}    | \${7:Data}     | \${8:Data}     |\n| \${9:Row 2}    | \${10:Data}    | \${11:Data}    |\n\`\`\``;
            break;
        case 'code-block':
            snippet = `\`\`\`{code-block} \${1:python}\n:linenos:\n:caption: \${2:Code example}\n\n\${3:# Your code here}\nprint("Hello, World!")\n\`\`\``;
            break;
        case 'code-cell':
            snippet = `\`\`\`{code-cell}\n:tags: [\${1:hide-input, hide-output}]\n\n\${2:# Executable Python code}\nimport numpy as np\nimport matplotlib.pyplot as plt\n\`\`\``;
            break;
        case 'math':
            snippet = `\`\`\`{math}\n:label: \${1:eq-label}\n\n\${2:E = mc^2}\n\`\`\``;
            break;
        case 'bibliography':
            snippet = `\`\`\`{bibliography}\n:filter: docname in docnames\n\`\`\``;
            break;
        case 'contents':
            snippet = `\`\`\`{contents}\n:depth: \${1:2}\n:local:\n\`\`\``;
            break;
        case 'glossary':
            snippet = `\`\`\`{glossary}\n\n\${1:term}\n  \${2:Definition of the term}\n\n\${3:another term}\n  \${4:Another definition}\n\`\`\``;
            break;
        default:
            snippet = `\`\`\`{${directiveType.label}}\n\${1:Content}\n\`\`\``;
    }

    await editor.insertSnippet(new vscode.SnippetString(snippet));
}

async function insertFigure() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Get image path from user
    const imagePath = await vscode.window.showInputBox({
        prompt: 'Enter image path (relative to document)',
        placeHolder: 'images/figure1.png',
        value: 'images/'
    });

    if (!imagePath) return;

    // Generate a label based on the image filename
    const defaultLabel = imagePath.split('/').pop()?.split('.')[0] || 'fig';
    
    const label = await vscode.window.showInputBox({
        prompt: 'Enter figure label (for cross-referencing)',
        placeHolder: 'fig-label',
        value: `fig-${defaultLabel}`
    });

    if (!label) return;

    const caption = await vscode.window.showInputBox({
        prompt: 'Enter figure caption',
        placeHolder: 'Figure description'
    });

    const snippet = `\`\`\`{figure} ${imagePath}
:name: ${label}
:width: \${1:400px}
:alt: \${2:Alternative text for accessibility}

${caption || '${3:Figure caption}'}
\`\`\``;

    await editor.insertSnippet(new vscode.SnippetString(snippet));
}

async function insertCitation() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const citationKey = await vscode.window.showInputBox({
        prompt: 'Enter citation key',
        placeHolder: 'author2023, doi:10.1000/example',
        value: ''
    });

    if (!citationKey) return;

    const citationType = await vscode.window.showQuickPick([
        { label: 'cite', description: 'Standard citation' },
        { label: 'cite:p', description: 'Parenthetical citation' },
        { label: 'cite:t', description: 'Text citation' },
        { label: 'cite:year', description: 'Year only' },
        { label: 'cite:author', description: 'Author only' }
    ], {
        placeHolder: 'Select citation style'
    });

    if (!citationType) return;

    const snippet = `{${citationType.label}}\`${citationKey}\``;
    await editor.insertSnippet(new vscode.SnippetString(snippet));
}

async function insertCrossReference() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const referenceType = await vscode.window.showQuickPick([
        { label: 'ref', description: 'Generic reference' },
        { label: 'numref', description: 'Numbered reference' },
        { label: 'eq', description: 'Equation reference' },
        { label: 'doc', description: 'Document reference' }
    ], {
        placeHolder: 'Select reference type'
    });

    if (!referenceType) return;

    const label = await vscode.window.showInputBox({
        prompt: 'Enter target label',
        placeHolder: 'fig-label, eq-einstein, section-intro',
        value: ''
    });

    if (!label) return;

    let snippet: string;
    if (referenceType.label === 'doc') {
        snippet = `{${referenceType.label}}\`${label}\``;
    } else {
        snippet = `{${referenceType.label}}\`${label}\``;
    }

    await editor.insertSnippet(new vscode.SnippetString(snippet));
}

async function insertEquation() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const label = await vscode.window.showInputBox({
        prompt: 'Enter equation label (for cross-referencing)',
        placeHolder: 'eq-einstein',
        value: 'eq-'
    });

    if (!label) return;

    const snippet = `\`\`\`{math}
:label: ${label}

\${1:E = mc^2}
\`\`\``;

    await editor.insertSnippet(new vscode.SnippetString(snippet));
}

async function insertCodeCell() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const language = await vscode.window.showQuickPick([
        { label: 'python', description: 'Python code' },
        { label: 'jupyter', description: 'Jupyter notebook style' },
        { label: 'r', description: 'R code' },
        { label: 'julia', description: 'Julia code' },
        { label: 'bash', description: 'Bash script' }
    ], {
        placeHolder: 'Select code language'
    });

    if (!language) return;

    const showTags = await vscode.window.showQuickPick([
        { label: 'yes', description: 'Include execution tags' },
        { label: 'no', description: 'Simple code cell' }
    ], {
        placeHolder: 'Include execution control tags?'
    });

    let snippet: string;
    if (showTags?.label === 'yes') {
        snippet = `\`\`\`{code-cell} ${language.label}
:tags: [\${1:hide-input, hide-output, remove-stderr}]

\${2:# Your ${language.label} code here}
\`\`\``;
    } else {
        snippet = `\`\`\`{code-cell} ${language.label}

\${1:# Your ${language.label} code here}
\`\`\``;
    }

    await editor.insertSnippet(new vscode.SnippetString(snippet));
}