// Custom type declaration to fix LinkifyIt namespace issue

declare module 'linkify-it' {
  namespace LinkifyIt {
    interface LinkifyIt {
      (schemas?: any): LinkifyIt.LinkifyIt;
      new (schemas?: any): LinkifyIt.LinkifyIt;
    }
  }

  const LinkifyIt: LinkifyIt.LinkifyIt;
  export = LinkifyIt;
}