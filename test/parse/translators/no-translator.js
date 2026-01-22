import { assert } from 'chai';

import { parse } from '../../../src/index.js';

describe('parse', function () {
  context('translators', function () {
    context('no translator', function () {
      specify('should not translate', function () {
        const parseResult = parse('$url', { translator: null });

        assert.isTrue(parseResult.result.success);
        assert.isUndefined(parseResult.tree);
      });
    });
  });
});
