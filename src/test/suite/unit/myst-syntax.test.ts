import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('MyST Syntax Grammar', () => {

    let mystGrammar: any;

    suiteSetup(() => {
        // Load the MyST grammar file
        const grammarPath = path.join(__dirname, '../../../../syntaxes/myst.tmLanguage.json');
        
        if (fs.existsSync(grammarPath)) {
            const grammarContent = fs.readFileSync(grammarPath, 'utf8');
            mystGrammar = JSON.parse(grammarContent);
        }
    });

    suite('Grammar Structure', () => {
        
        test('Should have valid MyST grammar structure', () => {
            assert(mystGrammar, 'MyST grammar should be loaded');
            assert.strictEqual(mystGrammar.name, 'MyST Markdown', 'Should have correct name');
            assert.strictEqual(mystGrammar.scopeName, 'text.mystmarkdown', 'Should have correct scope name');
            assert(mystGrammar.patterns, 'Should have patterns defined');
            assert(mystGrammar.repository, 'Should have repository defined');
        });

        test('Should include MyST role pattern', () => {
            assert(mystGrammar.repository, 'Should have repository');
            assert(mystGrammar.repository['myst-role'], 'Should have myst-role pattern');
            
            const mystRole = mystGrammar.repository['myst-role'];
            assert(mystRole.name, 'MyST role should have name');
            assert(mystRole.patterns, 'MyST role should have patterns');
            assert.strictEqual(mystRole.name, 'meta.myst.role', 'Should have correct role name');
        });

        test('Should include directive patterns', () => {
            assert(mystGrammar.repository.directive, 'Should have directive pattern');
            
            const directive = mystGrammar.repository.directive;
            assert.strictEqual(directive.name, 'meta.block.colon-fence.myst', 'Should have correct directive name');
            assert(directive.begin, 'Should have begin pattern');
            assert(directive.end, 'Should have end pattern');
        });

        test('Should include inline patterns with MyST role', () => {
            assert(mystGrammar.repository.inline, 'Should have inline patterns');
            
            const inlinePatterns = mystGrammar.repository.inline.patterns;
            const mystRolePattern = inlinePatterns.find((pattern: any) => 
                pattern.include === '#myst-role'
            );
            
            assert(mystRolePattern, 'Should include MyST role in inline patterns');
        });
    });

    suite('Pattern Validation', () => {
        
        test('MyST role patterns should be valid regex', () => {
            if (!mystGrammar || !mystGrammar.repository['myst-role']) {
                return; // Skip if grammar not loaded
            }
            
            const mystRole = mystGrammar.repository['myst-role'];
            const patterns = mystRole.patterns;
            
            patterns.forEach((pattern: any, index: number) => {
                if (pattern.match) {
                    // Test that the regex is valid
                    try {
                        new RegExp(pattern.match);
                    } catch (error) {
                        assert.fail(`MyST role pattern ${index} has invalid regex: ${pattern.match}`);
                    }
                }
                
                if (pattern.begin) {
                    try {
                        new RegExp(pattern.begin);
                    } catch (error) {
                        assert.fail(`MyST role pattern ${index} has invalid begin regex: ${pattern.begin}`);
                    }
                }
                
                if (pattern.end) {
                    try {
                        new RegExp(pattern.end);
                    } catch (error) {
                        assert.fail(`MyST role pattern ${index} has invalid end regex: ${pattern.end}`);
                    }
                }
            });
        });

        test('Directive pattern should be valid regex', () => {
            if (!mystGrammar || !mystGrammar.repository.directive) {
                return; // Skip if grammar not loaded
            }
            
            const directive = mystGrammar.repository.directive;
            
            // Test begin pattern
            try {
                new RegExp(directive.begin);
            } catch (error) {
                assert.fail(`Directive begin pattern is invalid: ${directive.begin}`);
            }
            
            // Test end pattern
            try {
                new RegExp(directive.end);
            } catch (error) {
                assert.fail(`Directive end pattern is invalid: ${directive.end}`);
            }
        });
    });

    suite('Pattern Matching', () => {
        
        test('MyST role pattern should match valid role syntax', () => {
            if (!mystGrammar || !mystGrammar.repository['myst-role']) {
                return; // Skip if grammar not loaded
            }
            
            // Test the single-line role pattern
            const singlePattern = mystGrammar.repository['myst-role'].patterns.find(
                (p: any) => p.name === 'meta.myst.role.single'
            );
            
            if (singlePattern && singlePattern.match) {
                const regex = new RegExp(singlePattern.match);
                
                // Test valid MyST role syntax
                assert(regex.test('{ref}`label`'), 'Should match basic role syntax');
                assert(regex.test('{cite}`author2023`'), 'Should match cite role');
                assert(regex.test('{doc}`path/to/doc`'), 'Should match doc role');
                assert(regex.test('{math}`x^2`'), 'Should match math role');
                
                // Test with multiple backticks
                assert(regex.test('{code}``python code``'), 'Should match multi-backtick content');
            }
        });

        test('Directive pattern should match valid directive syntax', () => {
            if (!mystGrammar || !mystGrammar.repository.directive) {
                return; // Skip if grammar not loaded
            }
            
            const directive = mystGrammar.repository.directive;
            const beginRegex = new RegExp(directive.begin);
            
            // Test valid MyST directive syntax
            assert(beginRegex.test('```{note}'), 'Should match note directive');
            assert(beginRegex.test('```{warning}'), 'Should match warning directive');
            assert(beginRegex.test('  ```{figure}'), 'Should match indented directive');
            assert(beginRegex.test('```{code-block} python'), 'Should match directive with arguments');
            
            // Test invalid syntax should not match
            assert(!beginRegex.test('```python'), 'Should not match regular code blocks');
            assert(!beginRegex.test('{note}'), 'Should not match without backticks');
        });

        test('Should not match invalid MyST syntax', () => {
            if (!mystGrammar || !mystGrammar.repository['myst-role']) {
                return; // Skip if grammar not loaded
            }
            
            const singlePattern = mystGrammar.repository['myst-role'].patterns.find(
                (p: any) => p.name === 'meta.myst.role.single'
            );
            
            if (singlePattern && singlePattern.match) {
                const regex = new RegExp(singlePattern.match);
                
                // Test invalid syntax
                assert(!regex.test('ref`label`'), 'Should not match without curly braces');
                assert(!regex.test('{ref}label'), 'Should not match without backticks');
                assert(!regex.test('{123}`label`'), 'Should not match numeric role names');
                assert(!regex.test('{ref-}`label`'), 'Should not match roles ending with dash');
            }
        });
    });

    suite('Scope Names', () => {
        
        test('Should have appropriate scope names for syntax highlighting', () => {
            if (!mystGrammar || !mystGrammar.repository['myst-role']) {
                return; // Skip if grammar not loaded
            }
            
            const mystRole = mystGrammar.repository['myst-role'];
            const patterns = mystRole.patterns;
            
            patterns.forEach((pattern: any) => {
                if (pattern.captures) {
                    Object.values(pattern.captures).forEach((capture: any) => {
                        assert(
                            typeof capture.name === 'string' && capture.name.length > 0,
                            'Capture groups should have valid scope names'
                        );
                    });
                }
                
                if (pattern.beginCaptures) {
                    Object.values(pattern.beginCaptures).forEach((capture: any) => {
                        assert(
                            typeof capture.name === 'string' && capture.name.length > 0,
                            'Begin capture groups should have valid scope names'
                        );
                    });
                }
            });
        });

        test('Should use MyST-specific scope names', () => {
            if (!mystGrammar || !mystGrammar.repository['myst-role']) {
                return; // Skip if grammar not loaded
            }
            
            const mystRole = mystGrammar.repository['myst-role'];
            const hasMySTScope = JSON.stringify(mystRole).includes('myst');
            
            assert(hasMySTScope, 'Should use MyST-specific scope names for proper highlighting');
        });
    });
});