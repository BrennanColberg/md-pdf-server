# How this markdown-to-pdf blog server works

In a world obsessed with dynamic web content, we've built something heretical - a server that renders Markdown directly to PDF, bypassing the browser's rendering engine entirely. Let me walk you through this beautiful heresy.

The system starts where all web servers do - with a request. But instead of preparing HTML/CSS assets or hydrating React components, our Express server does something radical: it reaches for a Markdown file. Not to transform it into virtual DOM nodes, but to typeset it directly into a PDF document using React-PDF's primitives.

When a request hits our endpoint, we resolve the path to a Markdown file in our content directory. But before parsing, we perform a crucial transformation - processing custom <nav> tags. These aren't React components or web components, but simple text replacements that generate Markdown links by reading the filesystem. It's static site generation at its most primitive: direct file system access replacing complex content APIs.

The Markdown parsing itself uses `marked`, but with a twist. Instead of outputting HTML strings, we walk the abstract syntax tree ourselves. Each heading becomes a React-PDF Text component with specific styling. Paragraphs get decomposed into text runs, with links transformed into PDF hyperlinks. Lists become vertical stacks of text elements with bullet points maintained through manual spacing - no CSS counters or list-style-type here.

What makes this approach fascinating is what's missing. There's no box model to fight against. No flexbox or grid layouts - just absolute positioning via fixed margins and padding. Font sizes are concrete from the moment they're specified. Links either work or they don't; no hover states or focus rings to manage.

The styling object reveals our secret weapon: consistency. By defining all styles upfront in a JavaScript object, we ensure every heading level 1 looks exactly the same, everywhere. No cascade to worry about, no specificity wars. When we say "marginBottom: 10", we mean it - not "10px that might get interpreted as 9.843px in some browser versions".

Error handling takes on new meaning here. A 404 isn't an HTML page - it's a PDF document created through the same rendering pipeline. Even our failures are typeset properly. The server generates this using the same React-PDF components, ensuring design consistency across happy and error paths.

The final PDF gets streamed directly to the response. No client-side JavaScript. No rehydration. Just a binary document that any PDF viewer from 2005 onward can display identically. We've traded the infinite possibilities of the web for the certainty of print-like layout. In doing so, we've sidestepped:

- Cumulative Layout Shift (because layout happens once)
- Device fragmentation (PDF viewers handle scaling)
- Browser-specific quirks (PostScript doesn't care if you're using Chrome or Safari)
- Dynamic content flicker (the PDF is immutable after rendering)

This approach won't work for every use case, but as a writing-focused platform? It's liberating. We get version control through actual files rather than database migrations. Styling that can't break unexpectedly. Links that either work or don't - no half-loaded states.

The web purists may shudder, but sometimes the most radical act is to step away from the browser's rendering engine entirely. We've found peace in PDF's fixed layouts. You might too.

## Key Technologies Powering This Approach

[Bun](https://github.com/oven-sh/bun) - runtime, package manager, etc

[Express](https://github.com/expressjs/express) - The minimalist web server handling our PDF delivery

[Marked](https://github.com/markedjs/marked) - Lightning-fast Markdown parser that gives us the AST to work with

[React-PDF](https://github.com/diego3g/react-pdf) - PDF renderer that lets us use React-like components for layout

[html-entities](https://github.com/marthyn/html-entities) - Handles decoding HTML entities in Markdown content

## Credit / use it yourself

made by [Brennan Colberg](https://brennancolberg.com) ([@BrennanColberg](https://x.com/brennancolberg)). source code is [on GitHub](https://github.com/brennancolberg/md-pdf-server)
