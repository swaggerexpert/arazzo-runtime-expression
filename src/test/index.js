import parse from '../parse/index.js';

const test = (runtimeExpression) => {
  if (typeof runtimeExpression !== 'string') return false;

  try {
    const { result } = parse(runtimeExpression);
    return result.success;
  } catch {
    return false;
  }
};

export default test;
