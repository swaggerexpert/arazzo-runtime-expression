import { assert } from 'chai';

import { parse } from '../src/index.js';

describe('parse', function () {
  context('given invalid source string', function () {
    context('empty string', function () {
      specify('should fail parsing', function () {
        const { result, tree } = parse('');

        assert.isFalse(result.success);
        assert.isUndefined(tree);
      });
    });

    context('1', function () {
      specify('should fail parsing', function () {
        const { result, tree } = parse('1');

        assert.isFalse(result.success);
        assert.isUndefined(tree);
      });
    });

    context('nonsensical string', function () {
      specify('should fail parsing', function () {
        const { result, tree } = parse('nonsensical string');

        assert.isFalse(result.success);
        assert.isUndefined(tree);
      });
    });
  });

  context('given non-string input', function () {
    specify('should throw TypeError', function () {
      assert.throws(() => parse(1), TypeError, 'Runtime expression must be a string');
      assert.throws(() => parse(null), TypeError, 'Runtime expression must be a string');
      assert.throws(() => parse(undefined), TypeError, 'Runtime expression must be a string');
    });
  });
});
