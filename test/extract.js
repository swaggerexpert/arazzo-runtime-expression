import { assert } from 'chai';

import { extract, interpolate, test, ArazzoRuntimeExpressionParseError } from '../src/index.js';
import validExpressions from './fixtures/expressions-valid.js';

describe('extract', function () {
  it('should extract single expression', function () {
    assert.deepEqual(extract('{$url}'), ['$url']);
    assert.deepEqual(extract('{$method}'), ['$method']);
    assert.deepEqual(extract('{$statusCode}'), ['$statusCode']);
    assert.deepEqual(extract('{$request.header.accept}'), ['$request.header.accept']);
    assert.deepEqual(extract('{$request.query.page}'), ['$request.query.page']);
    assert.deepEqual(extract('{$request.path.id}'), ['$request.path.id']);
    assert.deepEqual(extract('{$request.body}'), ['$request.body']);
    assert.deepEqual(extract('{$response.header.content-type}'), ['$response.header.content-type']);
    assert.deepEqual(extract('{$inputs.username}'), ['$inputs.username']);
    assert.deepEqual(extract('{$outputs.result}'), ['$outputs.result']);
    assert.deepEqual(extract('{$steps.loginStep.outputs.sessionToken}'), [
      '$steps.loginStep.outputs.sessionToken',
    ]);
    assert.deepEqual(extract('{$workflows.myWorkflow.inputs.username}'), [
      '$workflows.myWorkflow.inputs.username',
    ]);
    assert.deepEqual(extract('{$workflows.myWorkflow.outputs.result}'), [
      '$workflows.myWorkflow.outputs.result',
    ]);
    assert.deepEqual(extract('{$sourceDescriptions.petStore.getPets}'), [
      '$sourceDescriptions.petStore.getPets',
    ]);
    assert.deepEqual(extract('{$components.parameters.petId}'), ['$components.parameters.petId']);
  });

  it('should extract multiple expressions', function () {
    const result = extract('client_id={$inputs.clientId}&grant_type={$inputs.grantType}');
    assert.deepEqual(result, ['$inputs.clientId', '$inputs.grantType']);
  });

  it('should return empty array for no expressions', function () {
    assert.deepEqual(extract('no expressions here'), []);
    assert.deepEqual(extract('just plain text'), []);
  });

  it('should return empty array for non-string input', function () {
    assert.deepEqual(extract(null), []);
    assert.deepEqual(extract(123), []);
    assert.deepEqual(extract(undefined), []);
  });

  it('should handle complex step expressions', function () {
    const result = extract('code={$steps.browser-authorize.outputs.code}');
    assert.deepEqual(result, ['$steps.browser-authorize.outputs.code']);
  });

  it('should handle the full OAuth example', function () {
    const input =
      'client_id={$inputs.clientId}&grant_type={$inputs.grantType}&redirect_uri={$inputs.redirectUri}&client_secret={$inputs.clientSecret}&code={$steps.browser-authorize.outputs.code}';
    const result = extract(input);
    assert.deepEqual(result, [
      '$inputs.clientId',
      '$inputs.grantType',
      '$inputs.redirectUri',
      '$inputs.clientSecret',
      '$steps.browser-authorize.outputs.code',
    ]);
  });

  it('should handle mixed literal and expression content', function () {
    const result = extract('Hello {$inputs.name}, your role is {$inputs.role}');
    assert.deepEqual(result, ['$inputs.name', '$inputs.role']);
  });

  /**
   * Known limitation: $request.body and $response.body expressions with JSON pointers
   * cannot be reliably extracted from embedded {expression} syntax.
   *
   * This is because RFC 6901 (JSON Pointer) allows the `}` character in pointer paths,
   * making it impossible to determine where the expression ends within `{...}` delimiters.
   *
   * Note: This limitation ONLY affects $request.body#/... and $response.body#/... expressions.
   * Other expressions like $steps., $inputs., $outputs., etc. use the `name` rule which
   * excludes `}`, so they work correctly even with JSON pointers in their paths.
   *
   * Workaround: Use parse() directly on the raw expression (without {} delimiters)
   * for $request.body and $response.body expressions containing JSON pointers.
   */
  it('should handle body expressions with JSON pointers', function () {
    assert.deepEqual(extract('{$request.body#/url}'), ['$request.body#/url']);
    assert.deepEqual(extract('{$response.body#/status}'), ['$response.body#/status']);
    assert.deepEqual(extract('{$request.body#/user/uuid}'), ['$request.body#/user/uuid']);
  });

  it('should handle expressions with JSON pointers in name part', function () {
    const result = extract('pet={$steps.someStepId.outputs.pets#/0/id}');
    assert.deepEqual(result, ['$steps.someStepId.outputs.pets#/0/id']);
  });

  it('should return empty array for invalid expressions', function () {
    assert.deepEqual(extract('{invalid}'), []);
    assert.deepEqual(extract('{$unknown.type}'), []);
  });

  it('should handle empty string', function () {
    assert.deepEqual(extract(''), []);
  });

  it('should handle string with only literal characters', function () {
    assert.deepEqual(extract('abcdefghijklmnopqrstuvwxyz'), []);
    assert.deepEqual(extract('0123456789'), []);
    assert.deepEqual(extract('special!@#$%^&*()'), []);
  });

  it('should handle edge cases with { and } characters', function () {
    // { and } are excluded from literal-char, so they cause parse failures
    // when appearing outside of embedded expressions
    assert.deepEqual(extract('text with } in it'), []);
    assert.deepEqual(extract('text with { in it'), []);

    // Empty braces - no valid expression inside
    assert.deepEqual(extract('{}'), []);

    // Nested braces (invalid - inner braces not allowed in expression)
    assert.deepEqual(extract('{{$url}}'), []);

    // Expression followed by extra } - fails because } not allowed in literal
    assert.deepEqual(extract('{$url}}'), []);

    // Valid expression between valid literal content
    assert.deepEqual(extract('prefix{$url}suffix'), ['$url']);

    // | character is allowed in literal content (between { and })
    assert.deepEqual(extract('a|b{$url}c|d'), ['$url']);
  });

  describe('given strict: false', function () {
    const extractTolerant = (str) => extract(str, { strict: false });

    it('should treat braces not followed by $ as literal text', function () {
      assert.deepEqual(extractTolerant('{ "petId": "{$inputs.pet_id}", "c": "{$inputs.c}" }'), [
        '$inputs.pet_id',
        '$inputs.c',
      ]);
      assert.deepEqual(extractTolerant('{"a": "{hello}"} {$inputs.ok}'), ['$inputs.ok']);
      assert.deepEqual(extractTolerant('{{$inputs.ok}}'), ['$inputs.ok']);
      assert.deepEqual(extractTolerant('{}'), []);
    });

    it('should treat stray } as literal text', function () {
      assert.deepEqual(extractTolerant('a={$inputs.pet_id}&scope=$inputs.c}'), ['$inputs.pet_id']);
      assert.deepEqual(extractTolerant('{$url}}'), ['$url']);
      assert.deepEqual(extractTolerant('{$request.body#/a}b}'), ['$request.body#/a']);
    });

    it('should skip invalid expression attempts', function () {
      assert.deepEqual(extractTolerant('x={$inputs.}&y={$foo.bar}&z={$inputs.ok}'), ['$inputs.ok']);
      assert.deepEqual(extractTolerant('{$}'), []);
    });

    it('should skip unterminated expression attempts', function () {
      assert.deepEqual(extractTolerant('{$url'), []);
      assert.deepEqual(extractTolerant('{$a{$inputs.ok}'), ['$inputs.ok']);
      assert.deepEqual(extractTolerant('{$request.body#/a{b}'), []);
    });

    it('should extract adjacent expressions', function () {
      assert.deepEqual(extractTolerant('{$inputs.a}{$inputs.b}'), ['$inputs.a', '$inputs.b']);
    });

    it('should handle string without expressions', function () {
      assert.deepEqual(extractTolerant(''), []);
      assert.deepEqual(extractTolerant('no expressions here'), []);
      assert.deepEqual(extractTolerant('$inputs.ok'), []);
    });

    it('should return empty array for non-string input', function () {
      assert.deepEqual(extract(null, { strict: false }), []);
    });

    it('should only enable tolerant mode for strict: false', function () {
      assert.deepEqual(extract('{"a":{$url}}', { strict: 0 }), []);
      assert.deepEqual(extract('{"a":{$url}}', { strict: null }), []);
    });

    it('should validate an attempt exactly like test() and strict mode', function () {
      const candidates = [
        ...validExpressions,
        '$',
        '$inputs.',
        '$foo.bar',
        '$request.',
        '$request.body#',
        '$request.body#/a~2',
        '$request.query.a\\x',
        '$steps.a.b.outputs.c',
        '$url ',
        '$URL',
      ];

      candidates.forEach((candidate) => {
        const str = `{${candidate}}`;
        const valid = test(candidate);

        assert.strictEqual(extract(str).length === 1, valid, str);
        assert.strictEqual(extractTolerant(str).length === 1, valid, str);
      });
    });

    it('should match strict mode on every string strict mode accepts', function () {
      validExpressions.forEach((expression) => {
        const str = `prefix {${expression}} suffix`;
        const strict = extract(str);

        assert.deepEqual(strict, [expression], str);
        assert.deepEqual(extractTolerant(str), strict, str);
      });

      const all = validExpressions.map((expression) => `{${expression}}`).join('&');
      assert.deepEqual(extractTolerant(all), extract(all));
    });

    describe('given onError', function () {
      const collect = (str) => {
        const infos = [];
        const expressions = extract(str, { strict: false, onError: (info) => infos.push(info) });
        return { expressions, infos };
      };

      it('should report every invalid expression attempt', function () {
        const { expressions, infos } = collect('x={$inputs.}&y={$foo.bar}&z={$inputs.ok}&w={$url');

        assert.deepEqual(expressions, ['$inputs.ok']);
        assert.deepEqual(
          infos.map(({ text, start, length }) => ({ text, start, length })),
          [
            { text: '{$inputs.}', start: 2, length: 10 },
            { text: '{$foo.bar}', start: 15, length: 10 },
            { text: '{$url', start: 43, length: 5 },
          ],
        );
      });

      it('should describe each attempt with a parse error', function () {
        const { infos } = collect('x={$inputs.}&w={$url');

        assert.instanceOf(infos[0].error, ArazzoRuntimeExpressionParseError);
        assert.strictEqual(
          infos[0].error.message,
          'Invalid runtime expression "{$inputs.}" at position 2',
        );
        assert.strictEqual(infos[0].error.runtimeExpression, '$inputs.');
        assert.strictEqual(
          infos[1].error.message,
          'Unterminated runtime expression "{$url" at position 15',
        );
        assert.strictEqual(infos[1].error.runtimeExpression, '$url');
      });

      it('should pass the same information as interpolate', function () {
        const str = 'x={$inputs.}&y={$a{$inputs.ok}&z={$}';
        const fromExtract = collect(str).infos;
        const fromInterpolate = [];
        interpolate(str, () => '', {
          strict: false,
          onError: (info) => {
            fromInterpolate.push(info);
            return info.text;
          },
        });

        const describe = ({ text, start, length, error }) => ({
          text,
          start,
          length,
          message: error.message,
          runtimeExpression: error.runtimeExpression,
        });
        assert.deepEqual(fromExtract.map(describe), fromInterpolate.map(describe));
      });

      it('should ignore the return value of onError', function () {
        assert.deepEqual(extract('{$inputs.}{$url}', { strict: false, onError: () => 'x' }), [
          '$url',
        ]);
      });

      it('should not call onError for valid expressions and literal text', function () {
        assert.deepEqual(collect('{"a": "{$url}", "b": "}"}').infos, []);
      });

      it('should propagate an error thrown from onError', function () {
        const onError = ({ error }) => {
          throw error;
        };

        assert.throws(
          () => extract('{$inputs.}', { strict: false, onError }),
          ArazzoRuntimeExpressionParseError,
        );
      });

      it('should ignore onError that is not a function', function () {
        assert.deepEqual(extract('{$inputs.}{$url}', { strict: false, onError: 'x' }), ['$url']);
        assert.deepEqual(extract('{$inputs.}{$url}', { strict: false, onError: null }), ['$url']);
      });

      it('should ignore onError in strict mode', function () {
        let called = false;
        const onError = () => {
          called = true;
        };

        assert.deepEqual(extract('x={$inputs.}', { onError }), []);
        assert.deepEqual(extract('{$url}', { onError: 'not a function' }), ['$url']);
        assert.isFalse(called);
      });
    });
  });
});
