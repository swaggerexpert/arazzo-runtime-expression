import { assert } from 'chai';

import { interpolate, ArazzoRuntimeExpressionParseError } from '../src/index.js';

describe('interpolate', function () {
  it('should interpolate a single expression', function () {
    const result = interpolate('Hello {$inputs.name}!', () => 'world');
    assert.strictEqual(result, 'Hello world!');
  });

  it('should pass the raw expression to the resolver', function () {
    const seen = [];
    interpolate('{$url}{$method}', (expression) => {
      seen.push(expression);
      return '';
    });
    assert.deepEqual(seen, ['$url', '$method']);
  });

  it('should interpolate multiple expressions', function () {
    const values = { '$inputs.clientId': 'abc', '$inputs.grantType': 'code' };
    const result = interpolate(
      'client_id={$inputs.clientId}&grant_type={$inputs.grantType}',
      (expression) => values[expression],
    );
    assert.strictEqual(result, 'client_id=abc&grant_type=code');
  });

  it('should preserve literal content', function () {
    const result = interpolate('prefix{$url}suffix', () => 'X');
    assert.strictEqual(result, 'prefixXsuffix');
  });

  it('should replace every occurrence of a repeated expression', function () {
    const result = interpolate('{$outputs.token}-{$outputs.token}', () => 'abc');
    assert.strictEqual(result, 'abc-abc');
  });

  it('should not interpret replacement patterns in a resolved value', function () {
    // A naive String.prototype.replace would interpret `$&`, `$1`, etc. in the
    // replacement. The CST walk splices the value verbatim, so it must not.
    const result = interpolate('x={$inputs.v}', () => 'A$&B');
    assert.strictEqual(result, 'x=A$&B');
  });

  it('should not re-interpolate a resolved value that looks like an expression', function () {
    // A resolved value that itself looks like an embedded expression must never
    // be re-scanned - the single CST pass guarantees this.
    const values = { '$inputs.a': '{$inputs.b}', '$inputs.b': 'X' };
    const result = interpolate('{$inputs.a}{$inputs.b}', (expression) => values[expression]);
    assert.strictEqual(result, '{$inputs.b}X');
  });

  it('should return string with no expressions unchanged', function () {
    assert.strictEqual(
      interpolate('no expressions here', () => 'X'),
      'no expressions here',
    );
  });

  it('should return empty string unchanged', function () {
    assert.strictEqual(
      interpolate('', () => 'X'),
      '',
    );
  });

  it('should interpolate body expressions with JSON pointers', function () {
    const result = interpolate('{$request.body#/user/uuid}', (expression) => expression);
    assert.strictEqual(result, '$request.body#/user/uuid');
  });

  it('should interpolate expressions with JSON pointers in name part', function () {
    const result = interpolate('pet={$steps.someStepId.outputs.pets#/0/id}', () => 7);
    assert.strictEqual(result, 'pet=7');
  });

  describe('default stringification', function () {
    it('should render undefined as empty string', function () {
      assert.strictEqual(
        interpolate('a{$url}b', () => undefined),
        'ab',
      );
    });

    it('should render null as empty string', function () {
      assert.strictEqual(
        interpolate('a{$url}b', () => null),
        'ab',
      );
    });

    it('should render strings as-is', function () {
      assert.strictEqual(
        interpolate('{$url}', () => 'https://example.com'),
        'https://example.com',
      );
    });

    it('should render numbers via String()', function () {
      assert.strictEqual(
        interpolate('{$statusCode}', () => 200),
        '200',
      );
    });

    it('should render booleans via String()', function () {
      assert.strictEqual(
        interpolate('{$url}', () => true),
        'true',
      );
    });

    it('should render objects via JSON.stringify', function () {
      assert.strictEqual(
        interpolate('{$request.body}', () => ({ a: 1 })),
        '{"a":1}',
      );
    });

    it('should render arrays via JSON.stringify', function () {
      assert.strictEqual(
        interpolate('{$request.body}', () => [1, 2]),
        '[1,2]',
      );
    });

    it('should render an unserializable object as empty string', function () {
      // JSON.stringify returns undefined when toJSON() returns undefined;
      // it must not leak the literal string "undefined" into the output.
      assert.strictEqual(
        interpolate('a{$request.body}b', () => ({ toJSON: () => undefined })),
        'ab',
      );
    });
  });

  it('should support a custom stringify option', function () {
    const result = interpolate('{$request.body}', () => ({ a: 1 }), {
      stringify: (value) => JSON.stringify(value, null, 2),
    });
    assert.strictEqual(result, '{\n  "a": 1\n}');
  });

  it('should return template unchanged when it cannot be parsed', function () {
    assert.strictEqual(
      interpolate('text with } in it', () => 'X'),
      'text with } in it',
    );
    assert.strictEqual(
      interpolate('{invalid}', () => 'X'),
      '{invalid}',
    );
    assert.strictEqual(
      interpolate('{{$url}}', () => 'X'),
      '{{$url}}',
    );
  });

  it('should leave a braced literal that is not an expression unchanged', function () {
    // A JSON-object-looking brace segment makes the whole expression-string fail
    // to parse, so the template is returned as-is.
    assert.strictEqual(
      interpolate('{"a":1}', () => 'X'),
      '{"a":1}',
    );
    assert.strictEqual(
      interpolate('{"x":1}-{$inputs.username}', () => 'X'),
      '{"x":1}-{$inputs.username}',
    );
  });

  it('should throw for non-string template', function () {
    assert.throws(() => interpolate(123, () => 'X'), TypeError);
    assert.throws(() => interpolate(null, () => 'X'), TypeError);
  });

  it('should throw when resolver is not a function', function () {
    assert.throws(() => interpolate('{$url}', 'not a function'), TypeError);
    assert.throws(() => interpolate('{$url}'), TypeError);
  });

  describe('given strict: false', function () {
    const resolver = (expression) => `<${expression}>`;
    const interpolateTolerant = (template, options = {}) =>
      interpolate(template, resolver, { strict: false, ...options });

    it('should interpolate expressions in a JSON template', function () {
      assert.strictEqual(
        interpolateTolerant('{ "petId": "{$inputs.pet_id}", "c": "{$inputs.c}" }'),
        '{ "petId": "<$inputs.pet_id>", "c": "<$inputs.c>" }',
      );
    });

    it('should treat braces not followed by $ as literal text', function () {
      assert.strictEqual(
        interpolateTolerant('{"a": "{hello}"} {$inputs.ok}'),
        '{"a": "{hello}"} <$inputs.ok>',
      );
      assert.strictEqual(interpolateTolerant('{{$inputs.ok}}'), '{<$inputs.ok>}');
    });

    it('should treat stray } as literal text', function () {
      assert.strictEqual(
        interpolateTolerant('a={$inputs.pet_id}&scope=$inputs.c}'),
        'a=<$inputs.pet_id>&scope=$inputs.c}',
      );
      assert.strictEqual(interpolateTolerant('{$request.body#/a}b}'), '<$request.body#/a>b}');
    });

    it('should leave invalid expression attempts verbatim by default', function () {
      assert.strictEqual(
        interpolateTolerant('x={$inputs.}&y={$foo.bar}&z={$inputs.ok}'),
        'x={$inputs.}&y={$foo.bar}&z=<$inputs.ok>',
      );
      assert.strictEqual(interpolateTolerant('{$url'), '{$url');
      assert.strictEqual(interpolateTolerant('{$a{$inputs.ok}'), '{$a<$inputs.ok>');
    });

    it('should call onError for every invalid expression attempt', function () {
      const calls = [];
      interpolateTolerant('x={$inputs.}&y={$foo.bar}&z={$inputs.ok}{$url', {
        onError: (info) => {
          calls.push(info);
          return info.text;
        },
      });

      assert.deepEqual(
        calls.map(({ text, start, length }) => ({ text, start, length })),
        [
          { text: '{$inputs.}', start: 2, length: 10 },
          { text: '{$foo.bar}', start: 15, length: 10 },
          { text: '{$url', start: 40, length: 5 },
        ],
      );
      calls.forEach(({ error, start, length }) => {
        assert.instanceOf(error, ArazzoRuntimeExpressionParseError);
        assert.strictEqual(error.start, start);
        assert.strictEqual(error.length, length);
      });
      assert.deepEqual(
        calls.map(({ error }) => error.runtimeExpression),
        ['$inputs.', '$foo.bar', '$url'],
      );
      assert.strictEqual(
        calls[0].error.message,
        'Invalid runtime expression "{$inputs.}" at position 2',
      );
      assert.strictEqual(
        calls[2].error.message,
        'Unterminated runtime expression "{$url" at position 40',
      );
    });

    it('should create the error lazily and only once', function () {
      interpolateTolerant('{$foo.bar}', {
        onError: (info) => {
          assert.strictEqual(info.error, info.error);
          return info.text;
        },
      });
    });

    it('should report unterminated attempts', function () {
      const calls = [];
      const onError = (info) => {
        calls.push([info.text, info.start, info.length]);
        return info.text;
      };

      assert.strictEqual(interpolateTolerant('a{$', { onError }), 'a{$');
      assert.strictEqual(interpolateTolerant('{${$url}', { onError }), '{$<$url>');
      assert.strictEqual(interpolateTolerant('{$a{x}', { onError }), '{$a{x}');
      assert.deepEqual(calls, [
        ['{$', 1, 2],
        ['{$', 0, 2],
        ['{$a', 0, 3],
      ]);
    });

    it('should report positions as UTF-16 code unit offsets', function () {
      const calls = [];
      const result = interpolateTolerant('😀{$foo}😀{$inputs.ok}', {
        onError: (info) => {
          calls.push([info.text, info.start, info.length]);
          return info.text;
        },
      });

      assert.strictEqual(result, '😀{$foo}😀<$inputs.ok>');
      assert.deepEqual(calls, [['{$foo}', 2, 6]]);
    });

    it('should replace invalid expression attempts with onError return value', function () {
      assert.strictEqual(
        interpolateTolerant('a{$inputs.}b{$inputs.ok}', { onError: () => '' }),
        'ab<$inputs.ok>',
      );
    });

    it('should propagate errors thrown from onError', function () {
      assert.throws(
        () =>
          interpolateTolerant('{$inputs.ok}{$foo.bar}', {
            onError: ({ error }) => {
              throw error;
            },
          }),
        ArazzoRuntimeExpressionParseError,
        '{$foo.bar}',
      );
    });

    it('should throw when onError does not return a string', function () {
      assert.throws(
        () => interpolateTolerant('{$foo.bar}', { onError: () => undefined }),
        TypeError,
        'onError must return a string',
      );
    });

    it('should throw when onError is not a function', function () {
      assert.throws(
        () => interpolateTolerant('{$url}', { onError: null }),
        TypeError,
        'onError must be a function',
      );
      assert.throws(
        () => interpolate('{$url}', resolver, { onError: 'nope' }),
        TypeError,
        'onError must be a function',
      );
    });

    it('should not call onError in strict mode', function () {
      let called = false;
      const result = interpolate('{$foo.bar}', resolver, {
        onError: () => {
          called = true;
          return '';
        },
      });
      assert.strictEqual(result, '{$foo.bar}');
      assert.isFalse(called);
    });

    it('should only enable tolerant mode for strict: false', function () {
      assert.strictEqual(interpolate('{"a":{$url}}', resolver, { strict: 0 }), '{"a":{$url}}');
      assert.strictEqual(interpolate('{"a":{$url}}', resolver, { strict: null }), '{"a":{$url}}');
    });

    it('should apply stringify to resolved values', function () {
      assert.strictEqual(
        interpolate('{"a": {$request.body}}', () => ({ b: 1 }), { strict: false }),
        '{"a": {"b":1}}',
      );
    });

    it('should not re-interpolate a resolved value that looks like an expression', function () {
      const values = { '$inputs.a': '{$inputs.b}', '$inputs.b': 'X' };
      const result = interpolate('{{$inputs.a}{$inputs.b}}', (expression) => values[expression], {
        strict: false,
      });
      assert.strictEqual(result, '{{$inputs.b}X}');
    });

    it('should return templates without expressions unchanged', function () {
      assert.strictEqual(interpolateTolerant(''), '');
      assert.strictEqual(interpolateTolerant('{"a":1}'), '{"a":1}');
      assert.strictEqual(interpolateTolerant('text with } in it'), 'text with } in it');
    });
  });
});
