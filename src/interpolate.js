import { Parser } from 'apg-lite';

import Grammar from './grammar.js';
import CSTTranslator from './parse/translators/CSTTranslator.js';
import scan from './scanner.js';
import ArazzoRuntimeExpressionParseError from './errors/ArazzoRuntimeExpressionParseError.js';

const grammar = new Grammar();

/**
 * Default stringification of a resolved value.
 *
 * `undefined` and `null` become an empty string, strings are used as-is,
 * objects are serialized as JSON and everything else is coerced via String().
 */
const defaultStringify = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  // JSON.stringify returns undefined for values it cannot serialize
  // (e.g. an object whose toJSON() returns undefined); coalesce to ''.
  if (typeof value === 'object') return JSON.stringify(value) ?? '';
  return String(value);
};

/**
 * Default handling of an invalid expression attempt in non-strict mode:
 * the span is left in the output verbatim.
 */
const defaultOnError = ({ text }) => text;

/**
 * Interpolate (transclude) runtime expressions embedded in a template string.
 *
 * Every `{expression}` occurrence is replaced by the value returned from the
 * `resolver` callback, stringified via `stringify`. Literal characters are
 * preserved verbatim. When the template cannot be parsed as an
 * expression-string (e.g. it contains unbalanced `{`/`}`), it is returned
 * unchanged, mirroring the leniency of `extract`.
 *
 * With `strict: false`, any `{` not followed by `$` is treated as literal text
 * and every valid `{$...}` span is substituted, even when other parts of the
 * template are not parsable. Every invalid expression attempt (a span starting
 * with `{$` that is not a valid expression or is unterminated) is passed to
 * `onError`, whose return value replaces the span. By default the span is left
 * verbatim; throw from `onError` to fail instead.
 *
 * @example
 *
 * interpolate('Hello {$inputs.name}!', () => 'world');
 * // => 'Hello world!'
 *
 * interpolate('id={$inputs.id}&name={$inputs.name}', (expression) => values[expression]);
 * // => 'id=42&name=Alice'
 *
 * interpolate('{"id": "{$inputs.id}"}', () => 42, { strict: false });
 * // => '{"id": "42"}'
 */
const interpolate = (
  template,
  resolver,
  { strict = true, stringify = defaultStringify, onError = defaultOnError } = {},
) => {
  if (typeof template !== 'string') {
    throw new TypeError('Template must be a string');
  }
  if (typeof resolver !== 'function') {
    throw new TypeError('Resolver must be a function');
  }
  if (typeof onError !== 'function') {
    throw new TypeError('onError must be a function');
  }

  if (strict === false) {
    let output = '';

    for (const token of scan(template)) {
      if (token.type === 'expression') {
        output += stringify(resolver(token.expression));
      } else if (token.type === 'invalid') {
        const { text, expression, start, length, terminated } = token;
        let error;

        const replacement = onError({
          text,
          start,
          length,
          // created lazily - capturing a stack trace for every invalid attempt is costly
          get error() {
            if (error === undefined) {
              const message = terminated
                ? `Invalid runtime expression "${text}" at position ${start}`
                : `Unterminated runtime expression "${text}" at position ${start}`;
              error = new ArazzoRuntimeExpressionParseError(message, {
                runtimeExpression: expression,
                start,
                length,
              });
            }
            return error;
          },
        });

        if (typeof replacement !== 'string') {
          throw new TypeError('onError must return a string');
        }
        output += replacement;
      } else {
        output += token.text;
      }
    }

    return output;
  }

  const parser = new Parser();
  parser.ast = new CSTTranslator();
  const result = parser.parse(grammar, 'expression-string', template);

  if (!result.success) {
    return template;
  }

  const cst = parser.ast.getTree();
  let output = '';

  // Rebuild the string from the CST, substituting embedded-expression nodes
  // with their resolved and stringified values.
  for (const node of cst.children || []) {
    const exprNode =
      node.type === 'embedded-expression'
        ? node.children.find((child) => child.type === 'expression')
        : undefined;

    if (exprNode) {
      output += stringify(resolver(exprNode.text));
    } else {
      // literal-char, or a defensive fallback should the CST ever lack the
      // expected expression child - emit the node text verbatim.
      output += node.text;
    }
  }

  return output;
};

export default interpolate;
