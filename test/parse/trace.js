import { assert } from 'chai';

import { Parser } from 'apg-lite';

import { parse, Grammar, Trace } from '../../src/index.js';

const expectationsOf = (runtimeExpression) => {
  const { result, trace } = parse(runtimeExpression, { trace: true });

  assert.isFalse(result.success);
  return [...trace.inferExpectations()];
};

describe('parse', function () {
  context('trace', function () {
    context('inferExpectations', function () {
      specify('should list unabbreviated terminals at the failure offset', function () {
        assert.deepEqual(expectationsOf('$steps.find-pet.output.petId'), [
          '%x41-5A',
          '%x61-7A',
          '%x30-39',
          '-',
          '_',
          '.outputs.',
        ]);
      });

      specify('should not list terminals tried before the failure offset', function () {
        assert.deepEqual(expectationsOf('$response.body#name'), ['/']);
      });

      specify('should keep the spelling of case-insensitive literals', function () {
        const expectations = expectationsOf('$invalid');

        assert.includeMembers(expectations, ['$statusCode', '$sourceDescriptions.', '$method']);
        assert.notInclude(expectations, '$statuscode');
      });

      specify('should list every alternative of the expression at offset 0', function () {
        assert.deepEqual(expectationsOf(''), [
          '$url',
          '$method',
          '$statusCode',
          '$request.',
          '$response.',
          '$message.',
          '$inputs.',
          '$outputs.',
          '$steps.',
          '$workflows.',
          '$sourceDescriptions.',
          '$components.',
          '$self',
        ]);
      });

      specify('should list what can continue a repetition at the end of the input', function () {
        assert.deepEqual(expectationsOf('$inputs.'), [
          '%x41-5A',
          '%x61-7A',
          '%x30-39',
          '.',
          '-',
          '_',
        ]);
        assert.deepEqual(expectationsOf('$steps.foo'), [
          '%x41-5A',
          '%x61-7A',
          '%x30-39',
          '-',
          '_',
          '.outputs.',
        ]);
        assert.includeMembers(expectationsOf('$request.header.'), ['!', '-', '%x30-39']);
      });

      specify(
        'should list what can continue a bounded repetition at the end of the input',
        function () {
          const hexdig = ['%x30-39', 'A', 'B', 'C', 'D', 'E', 'F'];

          assert.deepEqual(expectationsOf('$request.query.\\u'), hexdig);
          assert.deepEqual(expectationsOf('$request.query.\\u0'), hexdig);
          assert.deepEqual(expectationsOf('$request.query.\\u00'), hexdig);
          assert.deepEqual(expectationsOf('$request.query.\\u004'), hexdig);
        },
      );

      specify('should not continue a repetition that reached its maximum', function () {
        const { result, trace } = parse('$request.body#', { trace: true });

        assert.isTrue(result.success);
        assert.deepEqual([...trace.inferExpectations()], ['/']);
      });

      specify('should list terminals of an incomplete JSON Pointer escape', function () {
        assert.deepEqual(expectationsOf('$response.body#/a~2'), ['0', '1']);
        assert.deepEqual(expectationsOf('$response.body#/a~'), ['0', '1']);
      });

      specify('should stringify to a quoted list', function () {
        const { trace } = parse('$response.body#name', { trace: true });

        assert.strictEqual(trace.inferExpectations().toString(), '"/"');
      });

      specify('should stringify quotes and backslashes unambiguously', function () {
        const { trace } = parse('$request.query.a\\', { trace: true });
        const expectations = trace.inferExpectations();

        assert.includeMembers([...expectations], ['"', '\\']);
        assert.match(expectations.toString(), /^"\\"", "\\\\", /);
      });

      specify('should start afresh when an instance is reused for another parse', function () {
        const grammar = new Grammar();
        const parser = new Parser();
        parser.trace = new Trace();

        parser.parse(grammar, 'expression', '$steps.find-pet.output.petId');
        parser.parse(grammar, 'expression', '$response.body#name');
        assert.deepEqual([...parser.trace.inferExpectations()], ['/']);

        const result = parser.parse(grammar, 'expression', '$x');
        assert.strictEqual(result.maxMatched, 0);
        assert.include([...parser.trace.inferExpectations()], '$url');
        assert.notInclude([...parser.trace.inferExpectations()], '/');
      });

      specify('should be overridable by a subclass', function () {
        class CustomTrace extends Trace {
          inferExpectations() {
            return ['custom', ...super.inferExpectations()];
          }
        }
        const trace = new CustomTrace();

        assert.isFunction(Trace.prototype.inferExpectations);
        assert.deepEqual(trace.inferExpectations(), ['custom']);
      });

      specify('should keep displayTrace available', function () {
        const { trace } = parse('$url', { trace: true });

        assert.include(trace.displayTrace(), '[TLS($url)]');
      });
    });
  });
});
