import { Trace as BaseTrace } from 'apg-lite';

import Expectations from './Expectations.js';

class Trace extends BaseTrace {
  inferExpectations() {
    const lines = this.displayTrace().split('\n');
    const expectations = new Set();
    let lastMatchedIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // capture the max match line (first one that ends in a single character match)
      if (line.includes('M|')) {
        const textMatch = line.match(/]'(.*)'$/);
        if (textMatch && textMatch[1]) {
          lastMatchedIndex = i;
        }
      }

      // collect terminal failures after the deepest successful match
      if (i > lastMatchedIndex) {
        const terminalFailMatch = line.match(/N\|\[TLS\(([^)]+)\)]/);
        if (terminalFailMatch) {
          expectations.add(terminalFailMatch[1]);
        }
      }
    }

    return new Expectations(...expectations);
  }
}

export default Trace;
