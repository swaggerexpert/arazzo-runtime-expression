import { Parser } from 'apg-lite';

import Grammar from './grammar.js';
import CSTTranslator from './parse/translators/CSTTranslator.js';

const grammar = new Grammar();

/**
 * Extract runtime expressions from a string containing embedded {expression} patterns.
 *
 * @example
 *
 * extract('{$url}'); // => ['$url']
 * extract('id={$inputs.id}&name={$inputs.name}'); // => ['$inputs.id', '$inputs.name']
 */
const extract = (str) => {
  if (typeof str !== 'string') {
    return [];
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
