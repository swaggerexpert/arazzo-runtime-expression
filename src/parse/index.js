import { Parser, Stats } from 'apg-lite';

import Grammar from '../grammar.js';
import ASTTranslator from './translators/ASTTranslator/index.js';
import Trace from './trace/Trace.js';
import ArazzoRuntimeExpressionParseError from '../errors/ArazzoRuntimeExpressionParseError.js';

const grammar = new Grammar();

const parse = (
  runtimeExpression,
  { stats = false, trace = false, translator = new ASTTranslator() } = {},
) => {
  if (typeof runtimeExpression !== 'string') {
    throw new TypeError('Runtime expression must be a string');
  }

  try {
    const parser = new Parser();

    if (translator) parser.ast = translator;
    if (stats) parser.stats = new Stats();
    if (trace) parser.trace = new Trace();

    const result = parser.parse(grammar, 'expression', runtimeExpression);

    return {
      result,
      tree: result.success && translator ? parser.ast.getTree() : undefined,
      stats: parser.stats,
      trace: parser.trace,
    };
  } catch (error) {
    throw new ArazzoRuntimeExpressionParseError(
      'Unexpected error during Arazzo Runtime Expression parsing',
      {
        cause: error,
        runtimeExpression,
      },
    );
  }
};

export default parse;
