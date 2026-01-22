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
  - `ASTTranslator` - Produces Abstract Syntax Tree with semantic node types (extends CSTTranslator)
  - `XMLTranslator` - Produces XML string representation (extends CSTTranslator)

- **`src/parse/translators/ASTTranslator/transformers.js`** - Transforms CST nodes to AST nodes. Uses secondary grammars for complex expressions like `$steps`, `$workflows`, `$sourceDescriptions`, and `$components`.

- **`src/parse/callbacks/cst.js`** - Generic CST callback factory used by translators to build tree nodes.

- **`src/extract.js`** - Extracts runtime expressions from template strings using the `expression-string` grammar rule.

### Grammar Structure

The grammar has two main parts:

1. **Primary grammar** - Parses standalone runtime expressions (e.g., `$url`, `$request.body#/id`)

2. **Expression-string grammar** - Parses template strings with embedded `{expression}` patterns:
   - `expression-string = *( literal-char / embedded-expression )`
   - `embedded-expression = "{" expression "}"`
   - `literal-char` excludes `{` and `}` characters

3. **Secondary grammars** - Parse the `name` part of complex expressions:
   - `steps-name` - For `$steps.{stepId}.outputs.{outputName}`
   - `workflows-name` - For `$workflows.{workflowId}.{inputs|outputs}.{subField}`
   - `source-descriptions-name` - For `$sourceDescriptions.{sourceName}.{reference}`
   - `components-name` - For `$components.{field}.{subField}`

**Important:** The `{` and `}` characters are excluded from:
- `unescape` rule (CHAR definition)
- `unescaped` rule (json-pointer definition)

This allows proper parsing of embedded expressions in template strings.

### Public API (exported from `src/index.js`)

- `parse(expression, options?)` - Parse a runtime expression, returns `{ result, tree }`
  - `options.translator` - CSTTranslator (default), ASTTranslator, XMLTranslator, or null for validation-only
  - `options.trace` - Enable tracing for debugging
  - `options.stats` - Enable statistics collection
- `test(expression)` - Validate a runtime expression, returns boolean
- `extract(string)` - Extract expressions from template string with `{expression}` patterns, returns `string[]`
- `Grammar` - Grammar class for accessing the ABNF definition
- `CSTTranslator` - CST translator class
- `ASTTranslator` - AST translator class
- `XMLTranslator` - XML translator class

### Build Output

The library produces dual module formats:
- `es/` - ES modules (`.mjs` files)
- `cjs/` - CommonJS modules (`.cjs` files)
- `types/` - TypeScript declarations

Babel handles the transformation with custom plugins for import extension rewriting.

### Testing

Test fixtures are in `test/fixtures/`:
- `expressions-valid.js` - Valid expression examples
- `ast-corpus/` - Expected AST output for each valid expression
- `cst-corpus/` - Expected CST output for each valid expression
