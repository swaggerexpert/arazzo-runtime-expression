# @swaggerexpert/arazzo-runtime-expression

[![npmversion](https://img.shields.io/npm/v/%40swaggerexpert%2Farazzo-runtime-expression?style=flat-square&label=npm%20package&color=%234DC81F&link=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2F%40swaggerexpert%2Farazzo-runtime-expression)](https://www.npmjs.com/package/@swaggerexpert/arazzo-runtime-expression)
[![npm](https://img.shields.io/npm/dm/@swaggerexpert/arazzo-runtime-expression)](https://www.npmjs.com/package/@swaggerexpert/arazzo-runtime-expression)
[![Test workflow](https://github.com/swaggerexpert/arazzo-runtime-expression/actions/workflows/test.yml/badge.svg)](https://github.com/swaggerexpert/arazzo-runtime-expression/actions)
[![Dependabot enabled](https://img.shields.io/badge/Dependabot-enabled-blue.svg)](https://dependabot.com/)
[![try on RunKit](https://img.shields.io/badge/try%20on-RunKit-brightgreen.svg?style=flat)](https://npm.runkit.com/@swaggerexpert/arazzo-runtime-expression)
[![Tidelift](https://tidelift.com/badges/package/npm/@swaggerexpert%2Farazzo-runtime-expression)](https://tidelift.com/subscription/pkg/npm-.swaggerexpert-arazzo-runtime-expression?utm_source=npm-swaggerexpert-arazzo-runtime-expression&utm_medium=referral&utm_campaign=readme)

[Arazzo Runtime Expressions](https://spec.openapis.org/arazzo/latest.html#runtime-expressions) allows values to be defined based on information that will be available within the HTTP message in an actual API call,
or within objects serialized from the Arazzo document such as [workflows](https://spec.openapis.org/arazzo/latest.html#workflow-object) or [steps](https://spec.openapis.org/arazzo/latest.html#step-object).

`@swaggerexpert/arazzo-runtime-expression` is a **parser**, **validator** and **extractor** for Arazzo Runtime Expressions.

It supports Runtime Expressions defined in following Arazzo specification versions:

- [Arazzo 1.0.0](https://spec.openapis.org/arazzo/v1.0.0.html)
- [Arazzo 1.0.1](https://spec.openapis.org/arazzo/v1.0.1.html)

<table>
  <tr>
    <td align="right" valign="middle">
        <img src="https://raw.githubusercontent.com/swaggerexpert/arazzo-runtime-expression/main/assets/tidelift.webp" alt="Tidelift" width="60" />
      </td>
      <td valign="middle">
        <a href="https://tidelift.com/subscription/pkg/npm-.swaggerexpert-arazzo-runtime-expression?utm_source=npm-swaggerexpert-arazzo-runtime-expression&utm_medium=referral&utm_campaign=readme">
            Get professionally supported @swaggerexpert/arazzo-runtime-expression with Tidelift Subscription.
        </a>
      </td>
  </tr>
</table>

## Table of Contents

- [Getting started](#getting-started)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Extraction](#extraction)
    - [Parsing](#parsing)
      - [Translators](#translators)
      - [Statistics](#statistics)
      - [Tracing](#tracing)
    - [Validation](#validation)
    - [Errors](#errors)
    - [Grammar](#grammar)
- [More about Arazzo runtime expressions](#more-about-arazzo-runtime-expressions)
- [License](#license)


## Getting started

### Installation

You can install `@swaggerexpert/arazzo-runtime-expression` using `npm`:

```sh
 $ npm install @swaggerexpert/arazzo-runtime-expression
```

### Usage

`@swaggerexpert/arazzo-runtime-expression` currently supports **extraction**, **parsing** and **validation**.
Both parser and validator are based on a superset of [ABNF](https://www.rfc-editor.org/rfc/rfc5234) ([SABNF](https://cs.github.com/ldthomas/apg-js2/blob/master/SABNF.md))
and use [apg-lite](https://github.com/ldthomas/apg-lite) parser generator.

#### Extraction

Arazzo embeds Runtime Expressions into string values surrounded with `{}` curly braces.
To extract Runtime Expressions from this embedded form, use the **extract** function.
The function returns an array of all extracted expressions, which can be used for further parsing or validation.

```js
import { extract, test, parse } from '@swaggerexpert/arazzo-runtime-expression';

// Extract single expression
extract('{$request.header.accept}'); // => ['$request.header.accept']

// Extract multiple expressions from a template string
extract('client_id={$inputs.clientId}&grant_type={$inputs.grantType}');
// => ['$inputs.clientId', '$inputs.grantType']

// No expressions found
extract('no expressions here'); // => []

// Use extracted expressions
const expressions = extract('{$url}');
test(expressions[0]); // => true
parse(expressions[0]); // => { result, tree }
```

**Known limitation:** `$request.body#/...` and `$response.body#/...` expressions with JSON pointers cannot be reliably
extracted from `{expression}` syntax. This is because [RFC 6901](https://datatracker.ietf.org/doc/html/rfc6901)
(JSON Pointer) allows the `}` character in pointer paths, making it impossible to determine where the expression ends.
Use `parse()` directly on the raw expression for these cases.

#### Parsing

Parsing a Runtime Expression is as simple as importing the **parse** function and calling it.

```js
import { parse } from '@swaggerexpert/arazzo-runtime-expression';

const parseResult = parse('$request.header.accept');
```

**parseResult** variable has the following shape:

```
{
  result: <ParseResult['result']>,
  tree: <ParseResult['tree']>,
  stats: <ParseResult['stats']>,
  trace: <ParseResult['trace']>,
}
```

[TypeScript typings](https://github.com/swaggerexpert/arazzo-runtime-expression/blob/main/types/index.d.ts) are available for all fields attached to parse result object returned by the `parse` function.

##### Translators

`@swaggerexpert/arazzo-runtime-expression` provides several translators to convert the parse result into different tree representations.

###### CST translator

[Concrete Syntax Tree](https://en.wikipedia.org/wiki/Parse_tree) (Parse tree) representation is available on parse result
when instance of `CSTTranslator` is provided via a `translator` option to the `parse` function.
CST is suitable to be consumed by other tools like IDEs, editors, etc...

```js
import { parse, CSTTranslator } from '@swaggerexpert/arazzo-runtime-expression';

const { tree: cst } = parse('$request.header.accept', { translator: new CSTTranslator() });
```

CST tree has a shape documented by [TypeScript typings (CSTNode)](https://github.com/swaggerexpert/arazzo-runtime-expression/blob/main/types/index.d.ts).

###### AST translator

**Default translator**. [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) representation is available on parse result
by default or when instance of `ASTTranslator` is provided via a `translator` option to the `parse` function.
AST is suitable to be consumed by implementations that need to analyze the structure of the runtime expression.

```js
import { parse } from '@swaggerexpert/arazzo-runtime-expression';

const { tree: ast } = parse('$request.header.accept');
```

or

```js
import { parse, ASTTranslator } from '@swaggerexpert/arazzo-runtime-expression';

const { tree: ast } = parse('$request.header.accept', { translator: new ASTTranslator() });
```

AST tree has a shape documented by [TypeScript typings (ASTNode)](https://github.com/swaggerexpert/arazzo-runtime-expression/blob/main/types/index.d.ts).

###### XML translator

```js
import { parse, XMLTranslator } from '@swaggerexpert/arazzo-runtime-expression';

const { tree: xml } = parse('$request.header.accept', { translator: new XMLTranslator() });
```

##### Statistics

`parse` function returns additional statistical information about the parsing process.
Collection of the statistics can be enabled by setting `stats` option to `true`.

```js
import { parse } from '@swaggerexpert/arazzo-runtime-expression';

const { stats } = parse('$request.header.accept', { stats: true });

stats.displayStats(); // returns operator statistics as string
```

##### Tracing

`parse` function returns additional tracing information about the parsing process.
Tracing can be enabled by setting `trace` option to `true`. Tracing is essential
for debugging failed parses or analyzing rule execution flow.

```js
import { parse } from '@swaggerexpert/arazzo-runtime-expression';

const { result, trace } = parse('$invalid', { trace: true });

result.success; // false
trace.displayTrace(); // returns trace information as string
```

Tracing also allows you to infer expected tokens at a failure point. This is useful for generating meaningful syntax error messages.

```js
import { parse } from '@swaggerexpert/arazzo-runtime-expression';

const { trace } = parse('$invalid', { trace: true });

const expectations = trace.inferExpectations();
console.log(expectations.toString()); // e.g., "expected '$url', '$method', '$statusCode', '$request.', ..."
```

#### Validation

Validating a Runtime Expression is as simple as importing the **test** function and calling it.

```js
import { test } from '@swaggerexpert/arazzo-runtime-expression';

test('$request.header.accept'); // => true
test('nonsensical string'); // => false
```

#### Errors

`@swaggerexpert/arazzo-runtime-expression` provides a structured error class hierarchy,
enabling precise error handling across runtime expression operations.

```js
import { ArazzoRuntimeExpressionError, ArazzoRuntimeExpressionParseError } from '@swaggerexpert/arazzo-runtime-expression';
```

**ArazzoRuntimeExpressionError** is the base class for all errors. **ArazzoRuntimeExpressionParseError** is thrown when parsing fails
and includes additional context about the expression that failed to parse.

```js
import { parse, ArazzoRuntimeExpressionParseError } from '@swaggerexpert/arazzo-runtime-expression';

try {
  parse(123); // non-string input
} catch (error) {
  if (error instanceof ArazzoRuntimeExpressionParseError) {
    console.log(error.runtimeExpression); // the expression that failed
  }
}
```

#### Grammar

New grammar instance can be created in following way:

```js
import { Grammar } from '@swaggerexpert/arazzo-runtime-expression';

const grammar = new Grammar();
```

To obtain original ABNF (SABNF) grammar as a string:

```js
import { Grammar } from '@swaggerexpert/arazzo-runtime-expression';

const grammar = new Grammar();

grammar.toString();
// or
String(grammar);
```

## More about Arazzo runtime expressions

The runtime expression is defined by the following [ABNF](https://tools.ietf.org/html/rfc5234) syntax

```abnf
; Arazzo runtime expression ABNF syntax
expression       = ( "$url" / "$method" / "$statusCode" / "$request." source / "$response." source / "$inputs." name / "$outputs." name / "$steps." name / "$workflows." name / "$sourceDescriptions." name / "$components." name )
source           = ( header-reference / query-reference / path-reference / body-reference )
header-reference = "header." token
query-reference  = "query." name
path-reference   = "path." name
body-reference   = "body" ["#" json-pointer ]
name             = *( CHAR )

; Grammar for parsing template strings with embedded expressions
expression-string    = *( literal-char / embedded-expression )
embedded-expression  = "{" expression "}"
literal-char         = %x00-7A / %x7C / %x7E-10FFFF  ; anything except { (%x7B) and } (%x7D)

; Secondary grammar for parsing $steps name part
; Format: {stepId}.{field}.{subField}[#/{jsonPointer}]
steps-name       = steps-id "." steps-field "." steps-sub-field ["#" json-pointer]
steps-id         = 1*(ALPHA / DIGIT / "_" / "-")
steps-field      = "outputs"
steps-sub-field  = 1*(ALPHA / DIGIT / "." / "-" / "_")

; Secondary grammar for parsing $workflows name part
; Format: {workflowId}.{field}.{subField}[#/{jsonPointer}]
workflows-name       = workflows-id "." workflows-field "." workflows-sub-field ["#" json-pointer]
workflows-id         = 1*(ALPHA / DIGIT / "_" / "-")
workflows-field      = "inputs" / "outputs"
workflows-sub-field  = 1*(ALPHA / DIGIT / "." / "-" / "_")

; Secondary grammar for parsing $sourceDescriptions name part
; Format: {sourceName}.{reference}
; reference can be operationId (unconstrained) or workflowId (constrained)
source-descriptions-name        = source-descriptions-source-name "." source-descriptions-reference
source-descriptions-source-name = 1*(ALPHA / DIGIT / "_" / "-")
source-descriptions-reference   = 1*CHAR

; Secondary grammar for parsing $components name part
; Format: {field}.{subField}
; Allowed fields: parameters, successActions, failureActions
components-name      = components-field "." components-sub-field
components-field     = "parameters" / "successActions" / "failureActions"
components-sub-field = 1*(ALPHA / DIGIT / "." / "-" / "_")

; https://datatracker.ietf.org/doc/html/rfc6901#section-3
json-pointer     = *( "/" reference-token )
reference-token  = *( unescaped / escaped )
unescaped        = %x00-2E / %x30-7D / %x7F-10FFFF
                 ; %x2F ('/') and %x7E ('~') are excluded from 'unescaped'
escaped          = "~" ( "0" / "1" )
                 ; representing '~' and '/', respectively

; https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.6
token          = 1*tchar
tchar          = "!" / "#" / "$" / "%" / "&" / "'" / "*"
               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
               / DIGIT / ALPHA
               ; any VCHAR, except delimiters

; https://www.rfc-editor.org/rfc/rfc7159#section-7
CHAR = unescape /
    escape (
        %x22 /          ; "    quotation mark  U+0022
        %x5C /          ; \    reverse solidus U+005C
        %x2F /          ; /    solidus         U+002F
        %x62 /          ; b    backspace       U+0008
        %x66 /          ; f    form feed       U+000C
        %x6E /          ; n    line feed       U+000A
        %x72 /          ; r    carriage return U+000D
        %x74 /          ; t    tab             U+0009
        %x75 4HEXDIG )  ; uXXXX                U+XXXX
escape         = %x5C   ; \
unescape       = %x20-21 / %x23-5B / %x5D-7A / %x7C / %x7E-10FFFF
               ; %x7B ('{') and %x7D ('}') are excluded from 'unescape'

; https://datatracker.ietf.org/doc/html/rfc5234#appendix-B.1
HEXDIG         =  DIGIT / "A" / "B" / "C" / "D" / "E" / "F"
DIGIT          =  %x30-39   ; 0-9
ALPHA          =  %x41-5A / %x61-7A   ; A-Z / a-z
```

The `name` identifier is case-sensitive, whereas `token` is not.

The table below provides examples of runtime expressions and examples of their use in a value:

#### Examples

Source Location | example expression  | notes
---|:---|:---|
HTTP Method            | `$method`         | The allowable values for the `$method` will be those for the HTTP operation.
Requested media type | `$request.header.accept`        |
Request parameter      | `$request.path.id`        | Request parameters MUST be declared in the `parameters` section of the parent operation or they cannot be evaluated. This includes request headers.
Request body property   | `$request.body#/user/uuid`   | In operations which accept payloads, references may be made to portions of the `requestBody` or the entire body.
Request URL            | `$url`            |
Response value         | `$response.body#/status`       |  In operations which return payloads, references may be made to portions of the response body or the entire body.
Response header        | `$response.header.Server` |  Single header values only are available
workflow input        | `$inputs.username` or `$workflows.foo.inputs.username` |  Single input values only are available
Step output value        | `$steps.someStepId.outputs.pets` |  In situations where the output named property return payloads, references may be made to portions of the response body (e.g., `$steps.someStepId.outputs.pets#/0/id`) or the entire body.
Workflow output value | `$outputs.bar` or `$workflows.foo.outputs.bar` |  In situations where the output named property return payloads, references may be made to portions of the response body (e.g., `$workflows.foo.outputs.mappedResponse#/name`) or the entire body.
Components parameter | `$components.parameters.foo` | Accesses a foo parameter defined within the Components Object.

Runtime expressions preserve the type of the referenced value.
Expressions can be embedded into string values by surrounding the expression with `{}` curly braces.

## License

`@swaggerexpert/arazzo-runtime-expression` is licensed under [Apache 2.0 license](https://github.com/swaggerexpert/arazzo-runtime-expression/blob/main/LICENSE).
`@swaggerexpert/arazzo-runtime-expression` comes with an explicit [NOTICE](https://github.com/swaggerexpert/arazzo-runtime-expression/blob/main/NOTICE) file
containing additional legal notices and information.
