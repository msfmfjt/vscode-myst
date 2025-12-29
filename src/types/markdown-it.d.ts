// Simple type declarations for markdown-it to fix TypeScript errors

declare module 'markdown-it' {
  interface Token {
    type: string;
    content: string;
    children?: Token[] | null;
    [key: string]: any;
  }

  interface MarkdownIt {
    use(plugin: any, ...args: any[]): MarkdownIt;
    render(md: string, env?: any): string;
    parse(src: string, env?: any): Token[];
    parseInline(src: string, env?: any): Token[];
    validateLink(url: string): boolean;
    [key: string]: any;
  }

  interface MarkdownItConstructor {
    new (presetName?: string | any, options?: any): MarkdownIt;
    (presetName?: string | any, options?: any): MarkdownIt;
  }

  const MarkdownIt: MarkdownItConstructor;
  export = MarkdownIt;
}

declare module 'markdown-it/lib/token' {
  interface Token {
    type: string;
    content: string;
    children?: Token[] | null;
    [key: string]: any;
  }
  
  const Token: any;
  export = Token;
}