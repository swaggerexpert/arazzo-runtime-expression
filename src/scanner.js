import test from './test/index.js';

/**
 * Tolerantly scan a string containing embedded {expression} patterns.
 *
 * An expression attempt is a span starting with `{$`. It ends at the first `}`
 * - no rule of the expression grammar can match `{` or `}`, so a valid
 * expression cannot extend past it. When `{` or the end of the string comes
 * before any `}`, the attempt is unterminated and scanning resumes at that `{`.
 * Everything outside of expression attempts is literal text.
 *
 * Returns a list of tokens covering the whole string:
 *  - { type: 'literal', text, start, length }
 *  - { type: 'expression', text, expression, start, length }
 *  - { type: 'invalid', text, terminated, start, length }
 *
 * `text` is always the raw span; `expression` is the span without the braces.
 *
 * @private
 */
const scan = (str) => {
  const tokens = [];
  let position = 0;

  const pushLiteral = (end) => {
    if (end > position) {
      tokens.push({
        type: 'literal',
        text: str.slice(position, end),
        start: position,
        length: end - position,
      });
    }
  };

  while (position < str.length) {
    const start = str.indexOf('{$', position);

    if (start === -1) {
      pushLiteral(str.length);
      break;
    }

    pushLiteral(start);

    let end = start + 2;
    while (end < str.length && str[end] !== '{' && str[end] !== '}') {
      end += 1;
    }

    if (str[end] === '}') {
      const text = str.slice(start, end + 1);
      const expression = text.slice(1, -1);
      const length = end + 1 - start;

      if (test(expression)) {
        tokens.push({ type: 'expression', text, expression, start, length });
      } else {
        tokens.push({ type: 'invalid', text, terminated: true, start, length });
      }
      position = end + 1;
    } else {
      // unterminated attempt - resume at the `{` (if any), it may start a new attempt
      tokens.push({
        type: 'invalid',
        text: str.slice(start, end),
        terminated: false,
        start,
        length: end - start,
      });
      position = end;
    }
  }

  return tokens;
};

export default scan;
