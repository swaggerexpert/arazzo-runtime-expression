import { assert } from 'chai';
import { jestExpect as expect } from 'mocha-expect-snapshot';

import { parse, CSTTranslator } from '../../../src/index.js';

describe('parse', function () {
  context('translators', function () {
    context('CSTTranslator', function () {
      specify('should translate $url to a CST', function () {
        const parseResult = parse('$url', { translator: new CSTTranslator() });

        assert.isTrue(parseResult.result.success);
        expect(parseResult.tree).toMatchSnapshot();
      });

      specify('should translate $request.body#/user/id to a CST', function () {
        const parseResult = parse('$request.body#/user/id', { translator: new CSTTranslator() });

        assert.isTrue(parseResult.result.success);
        expect(parseResult.tree).toMatchSnapshot();
      });

      specify('should translate $steps.login.outputs.token to a CST', function () {
        const parseResult = parse('$steps.login.outputs.token', { translator: new CSTTranslator() });

        assert.isTrue(parseResult.result.success);
        expect(parseResult.tree).toMatchSnapshot();
      });
    });
  });
});
