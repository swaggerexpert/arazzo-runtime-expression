import { utilities, identifiers } from 'apg-lite';

const cst = (nodeType) => {
  return (state, chars, phraseIndex, phraseLength, data) => {
    if (state === identifiers.SEM_PRE) {
      const node = {
        type: nodeType,
        text: utilities.charsToString(chars, phraseIndex, phraseLength),
        start: phraseIndex,
        length: phraseLength,
        children: [],
      };

      if (data.stack.length > 0) {
        data.stack[data.stack.length - 1].children.push(node);
      } else {
        data.root = node;
      }

      data.stack.push(node);
    }

    if (state === identifiers.SEM_POST) {
      data.stack.pop();
    }
  };
};

export default cst;
