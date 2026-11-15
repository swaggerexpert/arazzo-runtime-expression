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

      specify('should escape XML special characters', function () {
        const { tree } = parse('$request.body#/</node><x>&"\'', {
          translator: new XMLTranslator(),
        });

        assert.include(tree, '&lt;/node&gt;&lt;x&gt;&amp;&quot;&apos;');
        assert.notInclude(tree, '</node><x>');
        // outside of comments, every & starts one of the predefined entities
        assert.notMatch(tree.replace(/<!--[\s\S]*?-->/g, ''), /&(?!amp;|lt;|gt;|quot;|apos;)/);
      });

      specify('should replace characters that are invalid in XML', function () {
        const { tree } = parse('$request.query.a\uFFFEb', { translator: new XMLTranslator() });

        assert.include(tree, 'a\uFFFDb');
        assert.notInclude(tree, '\uFFFE');
      });
    });
  });
});
