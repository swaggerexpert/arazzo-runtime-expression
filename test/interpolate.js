import { assert } from 'chai';

import { interpolate } from '../src/index.js';

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

  it('should return string with no expressions unchanged', function () {
    assert.strictEqual(interpolate('no expressions here', () => 'X'), 'no expressions here');
  });

  it('should return empty string unchanged', function () {
    assert.strictEqual(interpolate('', () => 'X'), '');
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
      assert.strictEqual(interpolate('a{$url}b', () => undefined), 'ab');
    });

    it('should render null as empty string', function () {
      assert.strictEqual(interpolate('a{$url}b', () => null), 'ab');
    });

    it('should render strings as-is', function () {
      assert.strictEqual(interpolate('{$url}', () => 'https://example.com'), 'https://example.com');
    });

    it('should render numbers via String()', function () {
      assert.strictEqual(interpolate('{$statusCode}', () => 200), '200');
    });

    it('should render booleans via String()', function () {
      assert.strictEqual(interpolate('{$url}', () => true), 'true');
    });

    it('should render objects via JSON.stringify', function () {
      assert.strictEqual(interpolate('{$request.body}', () => ({ a: 1 })), '{"a":1}');
    });

    it('should render arrays via JSON.stringify', function () {
      assert.strictEqual(interpolate('{$request.body}', () => [1, 2]), '[1,2]');
    });
  });

  it('should support a custom stringify option', function () {
    const result = interpolate('{$request.body}', () => ({ a: 1 }), {
      stringify: (value) => JSON.stringify(value, null, 2),
    });
    assert.strictEqual(result, '{\n  "a": 1\n}');
  });

  it('should return template unchanged when it cannot be parsed', function () {
    assert.strictEqual(interpolate('text with } in it', () => 'X'), 'text with } in it');
    assert.strictEqual(interpolate('{invalid}', () => 'X'), '{invalid}');
    assert.strictEqual(interpolate('{{$url}}', () => 'X'), '{{$url}}');
  });

  it('should throw for non-string template', function () {
    assert.throws(() => interpolate(123, () => 'X'), TypeError);
    assert.throws(() => interpolate(null, () => 'X'), TypeError);
  });

  it('should throw when resolver is not a function', function () {
    assert.throws(() => interpolate('{$url}', 'not a function'), TypeError);
    assert.throws(() => interpolate('{$url}'), TypeError);
  });
});
