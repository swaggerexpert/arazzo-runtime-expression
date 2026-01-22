import { assert } from 'chai';
import { jestExpect as expect } from 'mocha-expect-snapshot';

import { parse, CSTTranslator } from '../../src/index.js';
import validExpressions from '../fixtures/expressions-valid.js';

describe('parse', function () {
  context('cst-corpus', function () {
    validExpressions.forEach((expression) => {
      specify(expression, function () {
        const parseResult = parse(expression, { translator: new CSTTranslator() });

        assert.isTrue(parseResult.result.success);
        expect(parseResult.tree).toMatchSnapshot();
      });
    });
  });
});
