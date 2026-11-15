import { Trace as BaseTrace, identifiers as id } from 'apg-lite';

import Grammar from '../../grammar.js';
import Expectations from './Expectations.js';

// TLS (case-insensitive literal) opcodes store the string lowercased; the grammar source
// keeps the spelling it is written with (e.g. "$statusCode"), so expectations use that.
const literalSpellings = new Map();
for (const [, literal] of String(new Grammar()).matchAll(/"([^"\n]*)"/g)) {
  const key = literal.toLowerCase();
  if (!literalSpellings.has(key)) literalSpellings.set(key, literal);
}

const hex = (code) => code.toString(16).toUpperCase().padStart(2, '0');

const describeTerminal = (op) => {
  switch (op.type) {
    case id.TLS: {
      const literal = String.fromCodePoint(...op.string);
      return literalSpellings.get(literal) ?? literal;
    }
    case id.TBS:
      return String.fromCodePoint(...op.string);
    case id.TRG:
      return op.min === op.max ? `%x${hex(op.min)}` : `%x${hex(op.min)}-${hex(op.max)}`;
    default:
      return undefined;
  }
};

// FIRST set of an opcode: the terminals a match of it can start with, and whether it can
// match the empty phrase (in which case what follows it can start the match as well)
const first = (rules, opcodes, index, visiting = new Set()) => {
  const op = opcodes[index];

  switch (op.type) {
    case id.ALT: {
      const terminals = [];
      let nullable = false;
      for (const child of op.children) {
        const result = first(rules, opcodes, child, visiting);
        terminals.push(...result.terminals);
        nullable = nullable || result.nullable;
      }
      return { terminals, nullable };
    }
    case id.CAT: {
      const terminals = [];
      for (const child of op.children) {
        const result = first(rules, opcodes, child, visiting);
        terminals.push(...result.terminals);
        if (!result.nullable) return { terminals, nullable: false };
      }
      return { terminals, nullable: true };
    }
    case id.REP: {
      const result = first(rules, opcodes, index + 1, visiting);
      return { terminals: result.terminals, nullable: op.min === 0 || result.nullable };
    }
    case id.RNM: {
      // a left-recursive reference adds nothing the outer visit does not already add
      if (visiting.has(op.index)) return { terminals: [], nullable: false };
      visiting.add(op.index);
      const result = first(rules, rules[op.index].opcodes, 0, visiting);
      visiting.delete(op.index);
      return result;
    }
    case id.TLS:
    case id.TBS:
      return { terminals: op.string.length > 0 ? [op] : [], nullable: op.string.length === 0 };
    case id.TRG:
      return { terminals: [op], nullable: false };
    default:
      // AND, NOT (look-ahead) and UDT do not consume input that can be described as a terminal
      return { terminals: [], nullable: true };
  }
};

const stateSymbol = Symbol('trace state');

class Trace extends BaseTrace {
  constructor() {
    super();

    const baseInit = this.init;
    const baseDown = this.down;
    const baseUp = this.up;
    let rules = [];
    let inputLength = 0;
    let repetitions = new Map();
    let lookAhead = 0;
    // repetitions in progress: where each one has got to and how many times its child matched
    let progress = [];
    const state = { maxMatched: 0, failures: [] };
    this[stateSymbol] = state;

    // only failures at the furthest offset are ever reported, so only those are kept
    const recordFailure = (op, offset) => {
      if (offset === state.maxMatched) state.failures.push({ op, offset });
    };

    this.init = (r, u, c) => {
      rules = r;
      inputLength = c.length;
      // the opcodes of a repetition's rule, and its position there, to find its child
      repetitions = new Map();
      for (const rule of r) {
        rule.opcodes.forEach((op, index) => {
          if (op.type === id.REP) repetitions.set(op, { opcodes: rule.opcodes, index });
        });
      }
      // a Trace instance may be reused for another parse
      lookAhead = 0;
      progress = [];
      state.maxMatched = 0;
      state.failures = [];
      baseInit(r, u, c);
    };

    this.down = (op, offset) => {
      if (op.type === id.AND || op.type === id.NOT) lookAhead += 1;
      if (op.type === id.REP) {
        const { opcodes, index } = repetitions.get(op);
        progress.push({ child: opcodes[index + 1], opcodes, index, position: offset, count: 0 });
      }
      baseDown(op, offset);
    };

    this.up = (op, opState, offset, phraseLength) => {
      if (op.type === id.AND || op.type === id.NOT) lookAhead -= 1;

      // look-ahead operators test the input without consuming it, so neither their
      // matches nor their failures say anything about what the input should contain
      if (lookAhead === 0) {
        if (opState === id.MATCH && offset + phraseLength > state.maxMatched) {
          state.maxMatched = offset + phraseLength;
          state.failures = [];
        }
        if (opState === id.NOMATCH && describeTerminal(op) !== undefined) {
          recordFailure(op, offset);
        }
      }

      const repetition = progress[progress.length - 1];
      if (repetition && op === repetition.child && opState === id.MATCH) {
        repetition.position = offset + phraseLength;
        repetition.count += 1;
      }

      if (op.type === id.REP) {
        progress.pop();
        // at the end of the input a repetition stops without trying its child again, so the
        // terminals that could have continued it are never tried; add them from its FIRST set
        if (lookAhead === 0 && repetition.position === inputLength && repetition.count < op.max) {
          const { opcodes, index } = repetition;
          for (const terminal of first(rules, opcodes, index + 1).terminals) {
            recordFailure(terminal, inputLength);
          }
        }
      }

      baseUp(op, opState, offset, phraseLength);
    };
  }

  /**
   * Terminals the grammar could have accepted at the offset where parsing stopped
   * (`result.maxMatched`), in the order the parser tried them, unabbreviated.
   * Character ranges are given in ABNF notation (e.g. `%x30-39`).
   */
  inferExpectations() {
    const { maxMatched, failures } = this[stateSymbol];
    const expectations = new Set();
    for (const { op, offset } of failures) {
      if (offset === maxMatched) expectations.add(describeTerminal(op));
    }
    return new Expectations(...expectations);
  }
}

export default Trace;
