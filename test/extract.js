import { assert } from 'chai';

import { extract } from '../src/index.js';

describe('extract', function () {
  it('should extract single expression', function () {
    assert.deepEqual(extract('{$url}'), ['$url']);
    assert.deepEqual(extract('{$method}'), ['$method']);
    assert.deepEqual(extract('{$statusCode}'), ['$statusCode']);
    assert.deepEqual(extract('{$request.header.accept}'), ['$request.header.accept']);
    assert.deepEqual(extract('{$request.query.page}'), ['$request.query.page']);
    assert.deepEqual(extract('{$request.path.id}'), ['$request.path.id']);
    assert.deepEqual(extract('{$request.body}'), ['$request.body']);
    assert.deepEqual(extract('{$request.body#/url}'), ['$request.body#/url']);
    assert.deepEqual(extract('{$response.header.content-type}'), ['$response.header.content-type']);
    assert.deepEqual(extract('{$response.body#/status}'), ['$response.body#/status']);
    assert.deepEqual(extract('{$inputs.username}'), ['$inputs.username']);
    assert.deepEqual(extract('{$outputs.result}'), ['$outputs.result']);
    assert.deepEqual(extract('{$steps.loginStep.outputs.sessionToken}'), ['$steps.loginStep.outputs.sessionToken']);
    assert.deepEqual(extract('{$workflows.myWorkflow.inputs.username}'), ['$workflows.myWorkflow.inputs.username']);
    assert.deepEqual(extract('{$workflows.myWorkflow.outputs.result}'), ['$workflows.myWorkflow.outputs.result']);
    assert.deepEqual(extract('{$sourceDescriptions.petStore.getPets}'), ['$sourceDescriptions.petStore.getPets']);
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
    const input = 'client_id={$inputs.clientId}&grant_type={$inputs.grantType}&redirect_uri={$inputs.redirectUri}&client_secret={$inputs.clientSecret}&code={$steps.browser-authorize.outputs.code}';
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
    const result = extract('Hello {$inputs.name}, your status is {$response.body#/status}');
    assert.deepEqual(result, ['$inputs.name', '$response.body#/status']);
  });

  it('should handle expressions with JSON pointers', function () {
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
});
