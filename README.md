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
        <img src="https://cdn2.hubspot.net/hubfs/4008838/website/logos/logos_for_download/Tidelift_primary-shorthand-logo.png" alt="Tidelift" width="60" />
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
    - [Validation](#validation)
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
Extracted Runtime Expression can be used for further parsing of validation.

```js
import { extract, test, parse } from '@swaggerexpert/arazzo-runtime-expression';

const expression = extract('{$request.header.accept}'); // => '$request.header.accept'

test(expression); // => true
parse(expression); // => { result, ast }
```

#### Parsing

Parsing a Runtime Expression is as simple as importing the **parse** function and calling it.

```js
import { parse } from '@swaggerexpert/arazzo-runtime-expression';

const parseResult = parse('$request.header.accept');
```

**parseResult** variable has the following shape:

```
{
  result: {
    success: true,
    state: 101,
    stateName: 'MATCH',
    length: 22,
    matched: 22,
    maxMatched: 22,
    maxTreeDepth: 13,
    nodeHits: 152
  },
  ast: fnast {
    callbacks: [
      expression: [Function: expression],
      'parameter-name': [Function: parameterName],
      source: [Function: source],
      'header-reference': [Function: headerReference],
      'query-reference': [Function: queryReference],
      'path-reference': [Function: pathReference],
      'body-reference': [Function: bodyReference],
      'json-pointer': [Function: jsonPointer],
      'reference-token': [Function: referenceToken],
      name: [Function: name],
      token: [Function: token]
    ],
    init: [Function (anonymous)],
    ruleDefined: [Function (anonymous)],
    udtDefined: [Function (anonymous)],
    down: [Function (anonymous)],
    up: [Function (anonymous)],
    translate: [Function (anonymous)],
    setLength: [Function (anonymous)],
    getLength: [Function (anonymous)],
    toXml: [Function (anonymous)]
  }
}
```

###### Interpreting AST as list of entries

```js
import { parse } from '@swaggerexpert/arazzo-runtime-expression';

const parseResult = parse('$request.header.accept');
const parts = [];

parseResult.ast.translate(parts);
```

After running the above code, **parts** variable has the following shape:

```js
[
  [ 'expression', '$request.header.accept' ],
  [ 'source', 'header.accept' ],
  [ 'header-reference', 'header.accept' ],
  [ 'token', 'accept' ],
]
```

###### Interpreting AST as XML

```js
import { parse } from '@swaggerexpert/arazzo-runtime-expression';

const parseResult = parse('$request.header.accept');
const xml = parseResult.ast.toXml();
```

After running the above code, **xml** variable has the following content:

```xml
<?xml version="1.0" encoding="utf-8"?>
<root nodes="4" characters="22">
  <!-- input string -->
  $request.header.accept
  <node name="expression" index="0" length="22">
    $request.header.accept
    <node name="source" index="9" length="13">
      header.accept
      <node name="header-reference" index="9" length="13">
        header.accept
        <node name="token" index="16" length="6">
          accept
        </node><!-- name="token" -->
      </node><!-- name="header-reference" -->
    </node><!-- name="source" -->
  </node><!-- name="expression" -->
</root>
```

> NOTE: AST can also be traversed in classical way using [depth first traversal](https://www.tutorialspoint.com/data_structures_algorithms/depth_first_traversal.htm). For more information about this option please refer to [apg-js](https://github.com/ldthomas/apg-js) and [apg-js-examples](https://github.com/ldthomas/apg-js-examples).

#### Validation

Validating a Runtime Expression is as simple as importing the **test** function and calling it.

```js
import { test } from '@swaggerexpert/arazzo-runtime-expression';

test('$request.header.accept'); // => true
test('nonsensical string'); // => false
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
expression       = ( "$url" / "$method" / "$statusCode" / "$request." source / "$response." source / "$inputs." name / "$outputs." name / "$steps." name / "$workflows." name / "$sourceDescriptions." name / "$components." name / "$components.parameters." parameter-name)
parameter-name   = name ; Reuses 'name' rule for parameter names
source           = ( header-reference / query-reference / path-reference / body-reference )
header-reference = "header." token
query-reference  = "query." name
path-reference   = "path." name
body-reference   = "body" ["#" json-pointer ]

; https://datatracker.ietf.org/doc/html/rfc6901#section-3
json-pointer     = *( "/" reference-token )
reference-token  = *( unescaped / escaped )
unescaped        = %x00-2E / %x30-7D / %x7F-10FFFF
                 ; %x2F ('/') and %x7E ('~') are excluded from 'unescaped'
escaped          = "~" ( "0" / "1" )
                 ; representing '~' and '/', respectively
name             = *( CHAR )
token            = 1*tchar
tchar            = "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "."
                 / "^" /"_" / "`" / "|" / "~" / DIGIT / ALPHA

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
unescape       = %x20-21 / %x23-5B / %x5D-10FFFF

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
