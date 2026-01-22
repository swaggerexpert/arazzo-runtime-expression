import { assert } from 'chai';
import { jestExpect as expect } from 'mocha-expect-snapshot';

import { parse, ASTTranslator } from '../../src/index.js';
import validExpressions from '../fixtures/expressions-valid.js';

describe('parse', function () {
  context('ast-corpus', function () {
    validExpressions.forEach((expression) => {
      specify(expression, function () {
        const parseResult = parse(expression, { translator: new ASTTranslator() });

        assert.isTrue(parseResult.result.success);
        expect(parseResult.tree).toMatchSnapshot();
      });
    });
  });
});
