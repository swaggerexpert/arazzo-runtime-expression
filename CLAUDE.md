# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm install              # Install dependencies
npm run build            # Full build: compile grammar + ES modules + CommonJS
npm run grammar:compile  # Compile ABNF grammar to JavaScript parser
npm run build:es         # Build ES modules only (to es/ directory)
npm run build:cjs        # Build CommonJS modules only (to cjs/ directory)
npm test                 # Run all tests with Mocha
npm run test:watch       # Run tests in watch mode
```

## Architecture

This library parses, validates, and extracts [Arazzo Runtime Expressions](https://spec.openapis.org/arazzo/latest.html#runtime-expressions) using an ABNF grammar and the apg-lite parser generator.

### Core Components

- **`src/grammar.bnf`** - ABNF grammar definition for Arazzo runtime expressions. When modified, run `npm run grammar:compile` to regenerate `src/grammar.js`.

- **`src/grammar.js`** - Auto-generated parser from the ABNF grammar. Do not edit directly.

- **`src/parse/index.js`** - Main parser function. Accepts `translator` option to customize output format. Returns `{ result, tree }`.

- **`src/parse/translators/`** - Translator classes that extend apg-lite's `Ast`:
  - `CSTTranslator` - Produces Concrete Syntax Tree with `{ type, text, start, length, children }` nodes
  - `XMLTranslator` - Produces XML string representation (extends CSTTranslator)

- **`src/parse/callbacks/cst.js`** - Generic CST callback factory used by translators to build tree nodes.

### Public API (exported from `src/index.js`)

- `parse(expression, options?)` - Parse a runtime expression, returns `{ result, tree }`
  - `options.translator` - CSTTranslator (default), XMLTranslator, or null for validation-only
- `test(expression)` - Validate a runtime expression, returns boolean
- `extract(string)` - Extract expression from `{expression}` notation, returns string or null
- `Grammar` - Grammar class for accessing the ABNF definition
- `CSTTranslator` - CST translator class
- `XMLTranslator` - XML translator class

### Build Output

The library produces dual module formats:
- `es/` - ES modules (`.mjs` files)
- `cjs/` - CommonJS modules (`.cjs` files)
- `types/` - TypeScript declarations

Babel handles the transformation with custom plugins for import extension rewriting.
