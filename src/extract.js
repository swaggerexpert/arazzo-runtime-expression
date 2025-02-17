/**
 * This function is used for extracting the expression from Arazzo Runtime Expression notation.
 *
 * @example
 *
 * extract('{$url}'); // => '$url'
 */

const extract = (arazzoRuntimeExpression) => {
  if (typeof arazzoRuntimeExpression !== 'string') {
    return null;
  }

  const match = arazzoRuntimeExpression.match(/^{(?<expression>.+)}$/);
  return match?.groups?.expression ?? null;
};

export default extract;
