class Expectations extends Array {
  toString() {
    // JSON string syntax, so that entries such as '"' and '\\' stay unambiguous
    return this.map((c) => JSON.stringify(String(c))).join(', ');
  }
}

export default Expectations;
