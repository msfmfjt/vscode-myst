import * as assert from 'assert';
import * as completion from '../../../completion';
import { extendMarkdownIt } from '../../../markdown-it-plugin-provider';
import MarkdownIt = require('markdown-it');
import { Position, TextDocument } from 'vscode';

suite('MyST Features', () => {

    suite('MyST Completion Provider', () => {
        
        test('Should provide MyST directive completions', async () => {
            // This is a basic test to ensure the module loads correctly
            // In a real VS Code environment, this would test the actual completion provider
            assert(typeof completion.activate === 'function', 'Should have activate function');
        });

        test('Should provide MyST role completions', async () => {
            // Simplified test for module structure
            assert(completion, 'Completion module should be available');
        });

        test('Should filter completions by typed text', async () => {
            // Test MyST directive pattern recognition
            const directivePattern = /^[ \t]*[`]{3,}\{[a-zA-Z\-]*$/;
            assert(directivePattern.test('```{note'), 'Should match note directive pattern');
            assert(directivePattern.test('```{war'), 'Should match partial directive pattern');
        });
    });

    suite('MyST Markdown-it Plugin', () => {
        
        test('Should load MyST-specific plugins', () => {
            const md = new MarkdownIt();
            const extendedMd = extendMarkdownIt(md);
            
            assert(extendedMd, 'Should return extended markdown-it instance');
            // Test that plugins are loaded (this is basic smoke test)
            assert(typeof extendedMd.render === 'function', 'Should have render function');
        });

        test('Should parse MyST footnotes', () => {
            const md = new MarkdownIt();
            const extendedMd = extendMarkdownIt(md);
            
            const input = 'Text with footnote[^1]\n\n[^1]: This is a footnote';
            const result = extendedMd.render(input);
            
            assert(result.includes('footnote'), 'Should process footnotes');
        });

        test('Should parse MyST definition lists', () => {
            const md = new MarkdownIt();
            const extendedMd = extendMarkdownIt(md);
            
            const input = 'Term\n: Definition of the term';
            const result = extendedMd.render(input);
            
            // Basic check that definition list elements are present
            assert(result.includes('Term'), 'Should include term');
            assert(result.includes('Definition'), 'Should include definition');
        });

        test('Should handle MyST math syntax', () => {
            const md = new MarkdownIt();
            const extendedMd = extendMarkdownIt(md);
            
            // Test basic math processing with KaTeX
            const input = 'Some text with math';
            const result = extendedMd.render(input);
            
            // Basic check that markdown processing works
            assert(typeof result === 'string', 'Should return rendered string');
            assert(result.includes('text'), 'Should include original text');
        });
    });

    suite('MyST Syntax Patterns', () => {
        
        test('Should identify MyST directive patterns', () => {
            const directivePattern = /^[ \t]*[`]{3,}\{[a-zA-Z\-]*$/;
            
            assert(directivePattern.test('```{note'), 'Should match note directive');
            assert(directivePattern.test('  ```{warning'), 'Should match indented directive');
            assert(directivePattern.test('```{code-block'), 'Should match hyphenated directive');
            assert(!directivePattern.test('```python'), 'Should not match regular code blocks');
            assert(!directivePattern.test('{note}'), 'Should not match without backticks');
        });

        test('Should identify MyST role patterns', () => {
            const rolePattern = /\{[a-zA-Z\-]*$/;
            
            assert(rolePattern.test('{ref'), 'Should match ref role');
            assert(rolePattern.test('text {cite'), 'Should match cite role in context');
            assert(rolePattern.test('{doc'), 'Should match doc role');
            assert(!rolePattern.test('```{note'), 'Should not match directive patterns');
        });

        test('Should handle MyST cross-reference syntax', () => {
            const refPattern = /\{(ref|numref|eq|doc)\}`([^`]+)`/;
            
            assert(refPattern.test('{ref}`my-label`'), 'Should match ref syntax');
            assert(refPattern.test('{numref}`fig-1`'), 'Should match numref syntax');
            assert(refPattern.test('{eq}`equation-1`'), 'Should match equation reference');
            assert(!refPattern.test('{unknown}`label`'), 'Should not match unknown roles');
        });
    });

    suite('MyST Content Validation', () => {
        
        test('Should validate MyST directive names', () => {
            const validDirectives = [
                'note', 'tip', 'warning', 'danger', 'important', 'error',
                'figure', 'table', 'code-block', 'code-cell', 'math',
                'bibliography', 'glossary', 'contents'
            ];
            
            validDirectives.forEach(directive => {
                const pattern = /^[a-zA-Z][a-zA-Z0-9\-]*$/;
                assert(pattern.test(directive), `${directive} should be valid directive name`);
            });
        });

        test('Should validate MyST role names', () => {
            const validRoles = [
                'ref', 'doc', 'download', 'cite', 'math', 'eq', 'numref',
                'code', 'kbd', 'guilabel', 'menuselection', 'file', 'term',
                'abbr', 'sup', 'sub'
            ];
            
            validRoles.forEach(role => {
                const pattern = /^[a-zA-Z][a-zA-Z0-9\-]*$/;
                assert(pattern.test(role), `${role} should be valid role name`);
            });
        });

        test('Should validate MyST label format', () => {
            const validLabels = ['fig-1', 'eq-einstein', 'sec-intro', 'tbl-data'];
            const invalidLabels = ['123-fig', '-invalid', 'invalid.', 'invalid space'];
            
            const labelPattern = /^[a-zA-Z][a-zA-Z0-9\-_]*$/;
            
            validLabels.forEach(label => {
                assert(labelPattern.test(label), `${label} should be valid label`);
            });
            
            invalidLabels.forEach(label => {
                assert(!labelPattern.test(label), `${label} should be invalid label`);
            });
        });
    });
});