import { assert } from 'chai';
import { jestExpect as expect } from 'mocha-expect-snapshot';

import { parse, XMLTranslator } from '../../../src/index.js';

describe('parse', function () {
  context('translators', function () {
    context('XMLTranslator', function () {
      specify('should translate $url to XML', function () {
        const parseResult = parse('$url', { translator: new XMLTranslator() });

        assert.isTrue(parseResult.result.success);
        expect(parseResult.tree).toMatchSnapshot();
      });

      specify('should translate $request.body#/user/id to XML', function () {
        const parseResult = parse('$request.body#/user/id', { translator: new XMLTranslator() });

        assert.isTrue(parseResult.result.success);
        expect(parseResult.tree).toMatchSnapshot();
      });
    });
  });
});
