'use strict'

import * as fs from 'fs';
import sizeOf from 'image-size';
import * as path from 'path';
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemProvider, CompletionList, ExtensionContext, languages, MarkdownString, Position, Range, SnippetString, TextDocument, workspace } from 'vscode';
import { configManager } from "./configuration/manager";
import { getAllTocEntry, IHeading } from './toc';
import { mathEnvCheck } from "./util/contextCheck";
import { Document_Selector_Markdown } from './util/generic';
import * as katexFuncs from './util/katex-funcs';

export function activate(context: ExtensionContext) {
    context.subscriptions.push(languages.registerCompletionItemProvider(Document_Selector_Markdown, new MdCompletionItemProvider(), '(', '\\', '/', '[', '#', '{'));
}

interface IReferenceDefinition {
    label: string;
    usageCount: number;
}

class MdCompletionItemProvider implements CompletionItemProvider {

    readonly RXlookbehind = String.raw`(?<=(^[>]? {0,3}\[[ \t\r\n\f\v]*))`; // newline, not quoted, max 3 spaces, open [
    readonly RXlinklabel = String.raw`(?<linklabel>([^\]]|(\\\]))*)`;       // string for linklabel, allows for /] in linklabel
    readonly RXlink = String.raw`(?<link>((<[^>]*>)|([^< \t\r\n\f\v]+)))`;  // link either <mylink> or mylink
    readonly RXlinktitle = String.raw`(?<title>[ \t\r\n\f\v]+(("([^"]|(\\"))*")|('([^']|(\\'))*')))?$)`; // optional linktitle in "" or ''
    readonly RXlookahead = String.raw`(?=(\]:[ \t\r\n\f\v]*` // close linklabel with ]:
        + this.RXlink + this.RXlinktitle + String.raw`)`; // end regex
    readonly RXflags = String.raw`mg`; // multiline & global
    // This pattern matches linklabels in link references definitions:  [linklabel]: link "link title"
    readonly Link_Label_Pattern = new RegExp(this.RXlookbehind + this.RXlinklabel + this.RXlookahead, this.RXflags);

    mathCompletions: CompletionItem[];

    readonly EXCLUDE_GLOB: string;

    constructor() {
        // \cmd
        let c1 = Array.from(new Set(
            [
                ...katexFuncs.delimiters0, ...katexFuncs.delimeterSizing0,
                ...katexFuncs.greekLetters0, ...katexFuncs.otherLetters0,
                ...katexFuncs.spacing0, ...katexFuncs.verticalLayout0,
                ...katexFuncs.logicAndSetTheory0, ...katexFuncs.macros0, ...katexFuncs.bigOperators0,
                ...katexFuncs.binaryOperators0, ...katexFuncs.binomialCoefficients0,
                ...katexFuncs.fractions0, ...katexFuncs.mathOperators0,
                ...katexFuncs.relations0, ...katexFuncs.negatedRelations0,
                ...katexFuncs.arrows0, ...katexFuncs.font0, ...katexFuncs.size0,
                ...katexFuncs.style0, ...katexFuncs.symbolsAndPunctuation0,
                ...katexFuncs.debugging0
            ]
        )).map(cmd => {
            let item = new CompletionItem('\\' + cmd, CompletionItemKind.Function);
            item.insertText = cmd;
            return item;
        });
        // \cmd{$1}
        let c2 = Array.from(new Set(
            [
                ...katexFuncs.accents1, ...katexFuncs.annotation1,
                ...katexFuncs.verticalLayout1, ...katexFuncs.overlap1, ...katexFuncs.spacing1,
                ...katexFuncs.logicAndSetTheory1, ...katexFuncs.mathOperators1, ...katexFuncs.sqrt1,
                ...katexFuncs.extensibleArrows1, ...katexFuncs.font1,
                ...katexFuncs.braketNotation1, ...katexFuncs.classAssignment1
            ]
        )).map(cmd => {
            let item = new CompletionItem('\\' + cmd, CompletionItemKind.Function);
            item.insertText = new SnippetString(`${cmd}\{$1\}`);
            return item;
        });
        // \cmd{$1}{$2}
        let c3 = Array.from(new Set(
            [
                ...katexFuncs.verticalLayout2, ...katexFuncs.binomialCoefficients2,
                ...katexFuncs.fractions2, ...katexFuncs.color2
            ]
        )).map(cmd => {
            let item = new CompletionItem('\\' + cmd, CompletionItemKind.Function);
            item.insertText = new SnippetString(`${cmd}\{$1\}\{$2\}`);
            return item;
        });
        let envSnippet = new CompletionItem('\\begin', CompletionItemKind.Snippet);
        envSnippet.insertText = new SnippetString('begin{${1|' + katexFuncs.envs.join(',') + '|}}\n\t$2\n\\end{$1}');

        // Pretend to support multi-workspacefolders
        const folder = workspace.workspaceFolders?.[0]?.uri;

        // Import macros from configurations
        const configMacros = configManager.get("katex.macros", folder);
        var macroItems: CompletionItem[] = [];
        for (const [cmd, expansion] of Object.entries(configMacros)) {
            let item = new CompletionItem(cmd, CompletionItemKind.Function);

            // Find the number of arguments in the expansion
            let numArgs = 0;
            for (let i = 1; i < 10; i++) {
                if (!expansion.includes(`#${i}`)) {
                    numArgs = i - 1;
                    break;
                }
            }

            item.insertText = new SnippetString(cmd.slice(1) + [...Array(numArgs).keys()].map(i => `\{$${i + 1}\}`).join(""));
            macroItems.push(item);
        }

        this.mathCompletions = [...c1, ...c2, ...c3, envSnippet, ...macroItems];

        // Sort
        for (const item of this.mathCompletions) {
            const label = typeof item.label === "string" ? item.label : item.label.label;
            item.sortText = label.replace(/[a-zA-Z]/g, (c) => {
                if (/[a-z]/.test(c)) {
                    return `0${c}`;
                } else {
                    return `1${c.toLowerCase()}`;
                }
            });
        }

        const Always_Exclude = ["**/node_modules", "**/bower_components", "**/*.code-search", "**/.git"];
        const excludePatterns = new Set(Always_Exclude);

        if (configManager.get("completion.respectVscodeSearchExclude", folder)) {
            // `search.exclude` is currently not implemented in Theia IDE (which is mostly compatible with VSCode extensions)
            // fallback to `files.exclude` (in VSCode, `search.exclude` inherits from `files.exclude`) or an empty list
            // see https://github.com/eclipse-theia/theia/issues/13823
            const vscodeSearchExclude = configManager.getByAbsolute<object>("search.exclude", folder)
                ?? configManager.getByAbsolute<object>("search.exclude", folder)
                ?? {};
            for (const [pattern, enabled] of Object.entries(vscodeSearchExclude)) {
                if (enabled) {
                    excludePatterns.add(pattern);
                }
            }
        }

        this.EXCLUDE_GLOB = "{" + Array.from(excludePatterns).join(",") + "}";
    }

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, _context: CompletionContext): Promise<CompletionItem[] | CompletionList<CompletionItem> | undefined> {
        const lineTextBefore = document.lineAt(position.line).text.substring(0, position.character);
        const lineTextAfter = document.lineAt(position.line).text.substring(position.character);

        let matches;
        matches = lineTextBefore.match(/\\+$/);
        // Math functions
        // ==============
        if (
            // ends with an odd number of backslashes
            (matches = lineTextBefore.match(/\\+$/)) !== null
            && matches[0].length % 2 !== 0
        ) {
            if (mathEnvCheck(document, position) === "") {
                return [];
            } else {
                return this.mathCompletions;
            }
        }

        // MyST Directives
        // ================
        // e.g. ```{directive|
        if (/^[ \t]*[`]{3,}\{[a-zA-Z\-]*$/.test(lineTextBefore)) {
            return this.completeMystDirectives(lineTextBefore);
        }

        // MyST Roles
        // ==========
        // e.g. {role|
        if (/\{[a-zA-Z\-]*$/.test(lineTextBefore) && !/^[ \t]*[`]{3,}\{[a-zA-Z\-]*$/.test(lineTextBefore)) {
            return this.completeMystRoles(lineTextBefore);
        }

        // Reference link labels
        // =====================
        // e.g. [linklabel]: link "link title"
        if (/\[[^\[\]]*$/.test(lineTextBefore)) {
            return this.completeRefLinks(document, lineTextBefore, position, token);
        }

        const enabled = workspace.getConfiguration('markdown.extension.completion', document.uri).get<boolean>('enabled', false);
        if (!enabled) {
            return [];
        }

        // Image paths
        // ===========
        if (/!\[[^\]]*?\]\([^\)]*$/.test(lineTextBefore) || /<img [^>]*src="[^"]*$/.test(lineTextBefore)) {
            return this.completeImgPaths(document, lineTextBefore);
        }

        // Links to heading
        // ================
        if (
            /\[[^\[\]]*?\]\(#[^#\)]*$/.test(lineTextBefore)
            || /^>? {0,3}\[[^\[\]]+?\]\:[ \t\f\v]*#[^#]*$/.test(lineTextBefore)
            // /\[[^\]]*\]\((\S*)#[^\)]*$/.test(lineTextBefore) // `[](url#anchor|` Link with anchor.
            // || /\[[^\]]*\]\:\s?(\S*)#$/.test(lineTextBefore) // `[]: url#anchor|` Link reference definition with anchor.
        ) {
            return this.completeLinksToHeading(document, position, lineTextBefore, lineTextAfter);
        }

        // File paths
        // ==========
        // should be after `completeLinksToHeading`
        if (/\[[^\[\]]*?\](?:(?:\([^\)]*)|(?:\:[ \t\f\v]*\S*))$/.test(lineTextBefore)) {
            return this.completeFilePaths(lineTextBefore, document);
        }

        return [];
    }

    private completeMystDirectives(lineTextBefore: string): CompletionItem[] {
        const mystDirectives = [
            { name: 'note', description: 'Create a note admonition', snippet: 'note}\n$1\n```' },
            { name: 'tip', description: 'Create a tip admonition', snippet: 'tip}\n$1\n```' },
            { name: 'warning', description: 'Create a warning admonition', snippet: 'warning}\n$1\n```' },
            { name: 'important', description: 'Create an important admonition', snippet: 'important}\n$1\n```' },
            { name: 'danger', description: 'Create a danger admonition', snippet: 'danger}\n$1\n```' },
            { name: 'error', description: 'Create an error admonition', snippet: 'error}\n$1\n```' },
            { name: 'figure', description: 'Create a figure', snippet: 'figure} ${1:image.png}\n:name: ${2:fig-label}\n:width: ${3:300px}\n\n${4:Caption text}\n```' },
            { name: 'code-block', description: 'Create a code block', snippet: 'code-block} ${1:python}\n:linenos:\n:caption: ${2:Code caption}\n\n${3:# Your code here}\n```' },
            { name: 'code-cell', description: 'Create an executable code cell', snippet: 'code-cell}\n:tags: [${1:tag1, tag2}]\n\n${2:# Your code here}\n```' },
            { name: 'math', description: 'Create a math block', snippet: 'math}\n:label: ${1:eq-label}\n\n${2:E = mc^2}\n```' },
            { name: 'table', description: 'Create a table', snippet: 'table} ${1:Table title}\n:name: ${2:tbl-label}\n\n| ${3:Column 1} | ${4:Column 2} |\n| --- | --- |\n| ${5:Data 1} | ${6:Data 2} |\n```' },
            { name: 'bibliography', description: 'Create a bibliography', snippet: 'bibliography}\n```' },
            { name: 'glossary', description: 'Create a glossary', snippet: 'glossary}\n\n${1:term}\n  ${2:Definition of the term}\n```' },
            { name: 'contents', description: 'Create a table of contents', snippet: 'contents}\n:depth: ${1:2}\n:local:\n```' },
            { name: 'include', description: 'Include another file', snippet: 'include} ${1:path/to/file.md}\n```' },
            { name: 'literalinclude', description: 'Include a code file', snippet: 'literalinclude} ${1:path/to/file.py}\n:language: ${2:python}\n:lines: ${3:1-10}\n```' },
            { name: 'card', description: 'Create a card layout', snippet: 'card} ${1:Card title}\n\n${2:Card content}\n```' },
            { name: 'grid', description: 'Create a grid layout', snippet: 'grid} ${1:2}\n\n${2:Grid content}\n```' },
            { name: 'tab-set', description: 'Create tabbed content', snippet: 'tab-set}\n\n:::{tab-item} ${1:Tab 1}\n${2:Content for tab 1}\n:::\n\n:::{tab-item} ${3:Tab 2}\n${4:Content for tab 2}\n:::\n```' }
        ];

        const typed = lineTextBefore.match(/\{([a-zA-Z\-]*)$/)?.[1] || '';
        
        return mystDirectives
            .filter(directive => directive.name.startsWith(typed))
            .map(directive => {
                const item = new CompletionItem(directive.name, CompletionItemKind.Snippet);
                item.insertText = new SnippetString(directive.snippet);
                item.documentation = new MarkdownString(directive.description);
                item.detail = `MyST Directive: ${directive.name}`;
                return item;
            });
    }

    private completeMystRoles(lineTextBefore: string): CompletionItem[] {
        const mystRoles = [
            { name: 'ref', description: 'Cross-reference to a label', snippet: 'ref}\`${1:label-name}\`' },
            { name: 'doc', description: 'Link to another document', snippet: 'doc}\`${1:path/to/document}\`' },
            { name: 'download', description: 'Download link', snippet: 'download}\`${1:path/to/file}\`' },
            { name: 'cite', description: 'Citation reference', snippet: 'cite}\`${1:citation-key}\`' },
            { name: 'math', description: 'Inline math', snippet: 'math}\`${1:x^2 + y^2}\`' },
            { name: 'eq', description: 'Reference to equation', snippet: 'eq}\`${1:equation-label}\`' },
            { name: 'numref', description: 'Numbered reference', snippet: 'numref}\`${1:figure-label}\`' },
            { name: 'code', description: 'Inline code with language', snippet: 'code}\`${1:python} ${2:print("hello")}\`' },
            { name: 'kbd', description: 'Keyboard input', snippet: 'kbd}\`${1:Ctrl+C}\`' },
            { name: 'guilabel', description: 'GUI label', snippet: 'guilabel}\`${1:File > Open}\`' },
            { name: 'menuselection', description: 'Menu selection', snippet: 'menuselection}\`${1:File --> Open}\`' },
            { name: 'file', description: 'File path', snippet: 'file}\`${1:path/to/file}\`' },
            { name: 'term', description: 'Glossary term', snippet: 'term}\`${1:terminology}\`' },
            { name: 'abbr', description: 'Abbreviation', snippet: 'abbr}\`${1:abbreviation (full form)}\`' },
            { name: 'sup', description: 'Superscript', snippet: 'sup}\`${1:text}\`' },
            { name: 'sub', description: 'Subscript', snippet: 'sub}\`${1:text}\`' }
        ];

        const typed = lineTextBefore.match(/\{([a-zA-Z\-]*)$/)?.[1] || '';
        
        return mystRoles
            .filter(role => role.name.startsWith(typed))
            .map(role => {
                const item = new CompletionItem(role.name, CompletionItemKind.Function);
                item.insertText = new SnippetString(role.snippet);
                item.documentation = new MarkdownString(role.description);
                item.detail = `MyST Role: ${role.name}`;
                return item;
            });
    }

    private completeImgPaths(document: TextDocument, lineTextBefore: string) {
        if (workspace.getWorkspaceFolder(document.uri) === undefined) return [];

        //// 🤔 better name?
        let typedDir: string;
        if (/!\[[^\]]*?\]\([^\)]*$/.test(lineTextBefore)) {
            //// `![](dir_here|)`
            typedDir = lineTextBefore.substr(lineTextBefore.lastIndexOf('](') + 2);
        } else {
            //// `<img src="dir_here|">`
            typedDir = lineTextBefore.substr(lineTextBefore.lastIndexOf('="') + 2);
        }
        const basePath = getBasepath(document, typedDir);
        const isRootedPath = typedDir.startsWith('/');

        return workspace.findFiles('**/*.{png,jpg,jpeg,svg,gif,webp}', this.EXCLUDE_GLOB).then(uris => {
            const items: CompletionItem[] = [];

            for (const imgUri of uris) {
                const label = path.relative(basePath, imgUri.fsPath).replace(/\\/g, '/');

                if (isRootedPath && label.startsWith("..")) {
                    continue;
                }

                let item = new CompletionItem(label.replace(/ /g, '%20'), CompletionItemKind.File);
                items.push(item);

                //// Add image preview
                let dimensions: { width: number; height: number; };
                try {
                    // @ts-ignore Deprecated.
                    dimensions = sizeOf(imgUri.fsPath);
                } catch (error) {
                    console.error(error);
                    continue;
                }
                const maxWidth = 318;
                if (dimensions.width > maxWidth) {
                    dimensions.height = Number(dimensions.height * maxWidth / dimensions.width);
                    dimensions.width = maxWidth;
                }
                item.documentation = new MarkdownString(`![${label}](${imgUri.fsPath.replace(/ /g, '%20')}|width=${dimensions.width},height=${dimensions.height})`);

                item.sortText = label.replace(/\./g, '{');
            }

            return items;
        });
    }

    private completeRefLinks(document: TextDocument, lineTextBefore: string, position: Position, token: CancellationToken) {
        // TODO: may be extracted to a seperate function and used for all completions in the future.
        const docText = document.getText();
        /**
         * NormalizedLabel (upper case) -> IReferenceDefinition
         */
        const refDefinitions = new Map<string, IReferenceDefinition>();

        for (const match of docText.matchAll(this.Link_Label_Pattern)) {
            // Remove leading and trailing whitespace characters.
            const label = match[0].replace(/^[ \t\r\n\f\v]+/, '').replace(/[ \t\r\n\f\v]+$/, '');
            // For case-insensitive comparison.
            const normalizedLabel = label.toUpperCase();

            // The one that comes first in the document is used.
            if (!refDefinitions.has(normalizedLabel)) {
                refDefinitions.set(normalizedLabel, {
                    label, // Preserve original case in result.
                    usageCount: 0,
                });
            }
        }

        if (refDefinitions.size === 0 || token.isCancellationRequested) {
            return;
        }

        // A confusing feature from #414. Not sure how to get it work.
        const docLines = docText.split(/\r?\n/);
        for (const crtLine of docLines) {
            // Match something that may be a reference link.
            const pattern = /\[([^\[\]]+?)\](?![(:\[])/g;
            for (const match of crtLine.matchAll(pattern)) {
                const label = match[1];
                const record = refDefinitions.get(label.toUpperCase());
                if (record) {
                    record.usageCount++;
                }
            }
        }

        let startIndex = lineTextBefore.lastIndexOf('[');
        const range = new Range(position.with({ character: startIndex + 1 }), position);

        if (token.isCancellationRequested) {
            return;
        }

        const completionItems = Array.from<IReferenceDefinition, CompletionItem>(refDefinitions.values(), ref => {
            const label = ref.label;
            const item = new CompletionItem(label, CompletionItemKind.Reference);
            const usages = ref.usageCount;
            item.documentation = new MarkdownString(label);
            item.detail = usages === 1 ? `1 usage` : `${usages} usages`;
            // Prefer unused items. <https://github.com/yzhang-gh/vscode-markdown/pull/414#discussion_r272807189>
            item.sortText = usages === 0 ? `0-${label}` : `1-${label}`;
            item.range = range;
            return item;
        });

        return completionItems
    }

    private completeLinksToHeading(document: TextDocument, position: Position, lineTextBefore: string, lineTextAfter: string) {
        let startIndex = lineTextBefore.lastIndexOf('#') - 1;
        let isLinkRefDefinition = /^>? {0,3}\[[^\[\]]+?\]\:[ \t\f\v]*#[^#]*$/.test(lineTextBefore); // The same as the 2nd conditon above.
        let endPosition = position;

        let addClosingParen = false;
        if (/^([^\) ]+\s*|^\s*)\)/.test(lineTextAfter)) {
            // try to detect if user wants to replace a link (i.e. matching closing paren and )
            // Either: ... <CURSOR> something <whitespace> )
            //     or: ... <CURSOR> <whitespace> )
            //     or: ... <CURSOR> )     (endPosition assignment is a no-op for this case)

            // in every case, we want to remove all characters after the cursor and before that first closing paren
            endPosition = position.with({ character: + endPosition.character + lineTextAfter.indexOf(')') });
        } else {
            // If no closing paren is found, replace all trailing non-white-space chars and add a closing paren
            // distance to first non-whitespace or EOL
            const toReplace = (lineTextAfter.search(/(?<=^\S+)(\s|$)/));
            endPosition = position.with({ character: + endPosition.character + toReplace });
            if (!isLinkRefDefinition) {
                addClosingParen = true;
            }
        }

        const range = new Range(position.with({ character: startIndex + 1 }), endPosition);

        return new Promise<CompletionItem[]>((res, _) => {
            const toc: readonly Readonly<IHeading>[] = getAllTocEntry(document, { respectMagicCommentOmit: false, respectProjectLevelOmit: false });

            const headingCompletions = toc.map<CompletionItem>(heading => {
                const item = new CompletionItem('#' + heading.slug, CompletionItemKind.Reference);

                if (addClosingParen) {
                    item.insertText = item.label + ')';
                }

                item.documentation = heading.rawContent;
                item.range = range;
                return item;
            });

            res(headingCompletions);
        });
    }

    private async completeFilePaths(lineTextBefore: string, document: TextDocument) {
        const typedDir = lineTextBefore.match(/(?<=((?:\]\()|(?:\]\:))[ \t\f\v]*)\S*$/)![0];
        const basePath = getBasepath(document, typedDir);
        const isRootedPath = typedDir.startsWith('/');

        const files = await workspace.findFiles("**/*", this.EXCLUDE_GLOB);

        const items: CompletionItem[] = [];

        for (const uri of files) {
            const label = path.relative(basePath, uri.fsPath).replace(/\\/g, "/").replace(/ /g, "%20");
            if (isRootedPath && label.startsWith("..")) {
                continue;
            }

            const item = new CompletionItem(label, CompletionItemKind.File);
            item.sortText = label.replace(/\./g, "{");
            items.push(item);
        }
        return items;
    }
}

/**
 * @param doc
 * @param dir The dir already typed in the src field, e.g. `[alt text](dir_here|)`
 */
function getBasepath(doc: TextDocument, dir: string): string {
    if (dir.includes('/')) {
        dir = dir.substr(0, dir.lastIndexOf('/') + 1);
    } else {
        dir = '';
    }

    let root = workspace.getWorkspaceFolder(doc.uri)!.uri.fsPath;
    const rootFolder = workspace.getConfiguration('markdown.extension.completion', doc.uri).get<string>('root', '');
    if (rootFolder.length > 0 && fs.existsSync(path.join(root, rootFolder))) {
        root = path.join(root, rootFolder);
    }

    const basePath = path.join(
        dir.startsWith('/')
            ? root
            : path.dirname(doc.uri.fsPath),
        dir
    );

    return basePath;
}
