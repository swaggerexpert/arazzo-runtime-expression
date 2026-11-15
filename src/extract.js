import { Parser } from 'apg-lite';

import Grammar from './grammar.js';
import CSTTranslator from './parse/translators/CSTTranslator.js';
import scan, { invalidAttemptInfo } from './scanner.js';

const grammar = new Grammar();

/**
 * Extract runtime expressions from a string containing embedded {expression} patterns.
 *
 * In strict mode (default) the whole string must parse as an expression-string,
 * otherwise an empty array is returned. With `strict: false`, any `{` not followed
 * by `$` is treated as literal text and every valid `{$...}` span is extracted;
 * invalid expression attempts are skipped. Each of them is reported to `onError`,
 * when given, with the same information `interpolate` passes to its `onError`;
 * its return value is ignored, as there is nothing to replace. `onError` is
 * ignored in strict mode.
 *
 * @example
 *
 * extract('{$url}'); // => ['$url']
 * extract('id={$inputs.id}&name={$inputs.name}'); // => ['$inputs.id', '$inputs.name']
 * extract('{"id": "{$inputs.id}"}', { strict: false }); // => ['$inputs.id']
 *
 * const errors = [];
 * extract('x={$inputs.}&y={$inputs.ok}', { strict: false, onError: (info) => errors.push(info) });
 * // => ['$inputs.ok'], errors[0].text === '{$inputs.}'
 */
const extract = (str, { strict = true, onError } = {}) => {
  if (typeof str !== 'string') {
    return [];
  }

  if (strict === false) {
    const expressions = [];
    for (const token of scan(str)) {
      if (token.type === 'expression') {
        expressions.push(token.expression);
      } else if (token.type === 'invalid' && typeof onError === 'function') {
        onError(invalidAttemptInfo(token));
      }
    }
    return expressions;
  }

  const parser = new Parser();
  parser.ast = new CSTTranslator();
  const result = parser.parse(grammar, 'expression-string', str);

  if (!result.success) {
    return [];
  }

  const cst = parser.ast.getTree();
  const expressions = [];

  // Traverse CST to find all embedded-expression nodes
  const traverse = (node) => {
    if (node.type === 'embedded-expression') {
      const exprNode = node.children.find((c) => c.type === 'expression');
      if (exprNode) {
        expressions.push(exprNode.text);
      }
    }
    for (const child of node.children || []) {
      traverse(child);
    }
  };

  traverse(cst);
  return expressions;
};

export default extract;
