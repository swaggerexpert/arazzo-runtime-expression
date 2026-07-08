import { Parser } from 'apg-lite';

import Grammar from './grammar.js';
import CSTTranslator from './parse/translators/CSTTranslator.js';

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
 * Interpolate (transclude) runtime expressions embedded in a template string.
 *
 * Every `{expression}` occurrence is replaced by the value returned from the
 * `resolver` callback, stringified via `stringify`. Literal characters are
 * preserved verbatim. When the template cannot be parsed as an
 * expression-string (e.g. it contains unbalanced `{`/`}`), it is returned
 * unchanged, mirroring the leniency of `extract`.
 *
 * @example
 *
 * interpolate('Hello {$inputs.name}!', () => 'world');
 * // => 'Hello world!'
 *
 * interpolate('id={$inputs.id}&name={$inputs.name}', (expression) => values[expression]);
 * // => 'id=42&name=Alice'
 */
const interpolate = (template, resolver, { stringify = defaultStringify } = {}) => {
  if (typeof template !== 'string') {
    throw new TypeError('Template must be a string');
  }
  if (typeof resolver !== 'function') {
    throw new TypeError('Resolver must be a function');
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
