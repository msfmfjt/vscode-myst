# MyST All in One for Visual Studio Code

![MyST Logo](images/Markdown-mark.png)

All you need for MyST Markdown (MyST syntax, scientific documentation, advanced editing, table of contents, auto preview and more).

**MyST (Markedly Structured Text)** is a powerful flavor of Markdown designed for scientific documentation, Jupyter Books, and academic publishing. This extension brings comprehensive MyST support to VS Code with advanced editing features, enhanced previews, and scientific writing tools.

***Note***: This extension is built on top of the excellent [Markdown All in One](https://github.com/yzhang-gh/vscode-markdown) extension, extending it with full MyST support and scientific documentation features.

## 🚀 Key Features

### 📝 Complete MyST Syntax Support

- **MyST Directives**: Full support for MyST directives like `{note}`, `{warning}`, `{figure}`, `{code-cell}`, and more
- **MyST Roles**: Inline roles for cross-references, citations, math, and links (`{ref}`, `{cite}`, `{math}`, etc.)
- **Enhanced Syntax Highlighting**: Custom grammar for MyST-specific syntax elements
- **Smart Auto-completion**: Context-aware suggestions for directives and roles

### 🔬 Scientific Documentation Features

- **Citation Management**: Easy insertion and management of citations with `{cite}` roles
- **Cross-Reference System**: Powerful cross-referencing with `{ref}`, `{numref}`, and `{eq}` roles
- **Figure Management**: Advanced figure insertion with captions and labels
- **Mathematical Equations**: Support for numbered equations with labels and references
- **Code Cells**: Executable code cells for Jupyter Book integration
- **Bibliography Support**: Built-in bibliography and glossary management

### 🎨 Enhanced Preview & Rendering

- **MyST Preview**: Rich preview with proper MyST directive and role rendering
- **Scientific Styling**: Custom CSS for admonitions, figures, equations, and code cells
- **Dark Theme Support**: Beautiful rendering in both light and dark themes
- **Export Features**: Enhanced HTML export with MyST features preserved

### ⚡ Advanced Editing Features

*Inherited from Markdown All in One plus MyST enhancements:*

- **Smart Keyboard Shortcuts**: All the standard markdown shortcuts (Bold, Italic, etc.)
- **Intelligent List Editing**: Auto-continuation, smart indentation, and task list management
- **Table Formatter**: Automatic table formatting and editing
- **Table of Contents**: Auto-generated TOC with MyST cross-reference support
- **Math Support**: Enhanced KaTeX rendering with MyST math blocks and roles

## 📋 MyST Commands

The extension provides several MyST-specific commands accessible via the Command Palette:

- **MyST: Insert Directive** - Interactive directive insertion with templates
- **MyST: Insert Figure** - Guided figure insertion with labels and captions
- **MyST: Insert Citation** - Quick citation insertion with various styles
- **MyST: Insert Cross Reference** - Smart cross-reference creation
- **MyST: Insert Numbered Equation** - Mathematical equation with auto-labeling
- **MyST: Insert Code Cell** - Executable code cell for Jupyter integration

## 🎯 Auto-completion Features

### MyST Directives
Type \`\`\`{ and get instant suggestions for:
- `note`, `tip`, `warning`, `danger`, `important`, `error` - Admonition blocks
- `figure` - Figures with captions and cross-reference labels
- `code-block`, `code-cell` - Code blocks and executable cells
- `math` - Mathematical equation blocks
- `table` - Tables with captions
- `bibliography`, `glossary`, `contents` - Reference sections

### MyST Roles
Type { and get instant suggestions for:
- `ref`, `numref`, `eq` - Cross-references to labels
- `cite` - Citations to bibliography entries
- `doc`, `download` - Document and file links
- `math` - Inline mathematical expressions
- `code`, `kbd`, `file` - Inline code and UI elements
- `term`, `abbr` - Glossary terms and abbreviations

## 📚 MyST Syntax Examples

### Admonitions
```markdown
\`\`\`{note}
This is a note admonition. It will be rendered with a special blue styling.
\`\`\`

\`\`\`{warning}
This is a warning. It draws attention to important information.
\`\`\`
```

### Cross-References and Citations
```markdown
See {ref}\`my-figure\` for details.

According to {cite}\`einstein1905\`, the relationship is described by {eq}\`mass-energy\`.

\`\`\`{math}
:label: mass-energy
E = mc^2
\`\`\`
```

### Figures and Code Cells
```markdown
\`\`\`{figure} path/to/image.png
:name: my-figure
:width: 400px
:alt: Alternative text

This is the figure caption.
\`\`\`

\`\`\`{code-cell}
:tags: [hide-input]

import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
plt.plot(x, np.sin(x))
plt.show()
\`\`\`
```

## ⚙️ Configuration

The extension inherits all configuration options from Markdown All in One and adds MyST-specific settings:

```json
{
  "markdown.extension.math.enabled": true,
  "markdown.extension.completion.enabled": true,
  "myst.preview.enable": true,
  "myst.preview.extensions": ["dollarmath", "amsmath", "deflist", "tasklist"]
}
```

## 🔧 Supported File Types

- `.md` - Standard Markdown files with MyST syntax
- `.myst` - Dedicated MyST Markdown files
- `.rmd` - R Markdown with MyST support
- `.qmd` - Quarto documents with MyST support

## 🚀 Getting Started

1. **Install the extension** from the VS Code marketplace
2. **Open a Markdown file** or create a new `.myst` file
3. **Start typing MyST syntax** - auto-completion will guide you
4. **Use Command Palette** (Ctrl+Shift+P) to access MyST commands
5. **Preview your document** with Ctrl+Shift+V to see rendered MyST

## 🎓 Educational Resources

- [MyST Documentation](https://mystmd.org/guide)
- [Jupyter Book Guide](https://jupyterbook.org/intro.html)
- [MyST Syntax Reference](https://mystmd.org/guide/quickstart-myst-markdown)
- [Scientific Writing with MyST](https://mystmd.org/guide/frontmatter)

## 🤝 Contributing

This extension builds upon the excellent [Markdown All in One](https://github.com/yzhang-gh/vscode-markdown) by Yu Zhang. 

For MyST-specific issues and features:
- Report issues on our [GitHub repository](https://github.com/mystx/vscode-myst-all-in-one)
- Contribute to MyST syntax and features
- Help improve scientific documentation workflows

For base Markdown features:
- See the original [Markdown All in One repository](https://github.com/yzhang-gh/vscode-markdown)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Yu Zhang** and contributors for the excellent [Markdown All in One](https://github.com/yzhang-gh/vscode-markdown) extension
- **Executable Books Team** for creating and maintaining MyST
- **Jupyter Book community** for scientific publishing innovation

---

**Happy MyST writing! 📖✨**