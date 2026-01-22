import { assert } from 'chai';
import { jestExpect as expect } from 'mocha-expect-snapshot';

import { parse, ASTTranslator } from '../../../src/index.js';

describe('parse', function () {
  context('translators', function () {
    context('ASTTranslator', function () {
      specify('should translate $url to an AST', function () {
        const parseResult = parse('$url', { translator: new ASTTranslator() });

        assert.isTrue(parseResult.result.success);
        expect(parseResult.tree).toMatchSnapshot();
      });

      specify('should translate $request.body#/user/id to an AST', function () {
        const parseResult = parse('$request.body#/user/id', { translator: new ASTTranslator() });

        assert.isTrue(parseResult.result.success);
        expect(parseResult.tree).toMatchSnapshot();
      });

      specify('should translate $steps.login.outputs.token to an AST', function () {
        const parseResult = parse('$steps.login.outputs.token', { translator: new ASTTranslator() });

        assert.isTrue(parseResult.result.success);
        expect(parseResult.tree).toMatchSnapshot();
      });
    });
  });
});
