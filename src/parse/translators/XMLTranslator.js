import CSTTranslator from './CSTTranslator.js';

class XMLTranslator extends CSTTranslator {
  getTree() {
    return this.toXml();
  }
}

export default XMLTranslator;
