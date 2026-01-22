import CSTTranslator from '../CSTTranslator.js';
import transformers, { transformCSTtoAST } from './transformers.js';

class ASTTranslator extends CSTTranslator {
  getTree() {
    const cst = super.getTree();
    return transformCSTtoAST(cst, transformers);
  }
}

export default ASTTranslator;
