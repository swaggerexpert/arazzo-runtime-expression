import { Ast as AST } from 'apg-lite';

import cstCallback from '../callbacks/cst.js';

class CSTTranslator extends AST {
  constructor() {
    super();

    // expression-string grammar rules
    this.callbacks['expression-string'] = cstCallback('expression-string');
    this.callbacks['embedded-expression'] = cstCallback('embedded-expression');
    this.callbacks['literal-char'] = cstCallback('literal-char');
    // main expression grammar rules
    this.callbacks['expression'] = cstCallback('expression');
    this.callbacks['source'] = cstCallback('source');
    this.callbacks['header-reference'] = cstCallback('header-reference');
    this.callbacks['query-reference'] = cstCallback('query-reference');
    this.callbacks['path-reference'] = cstCallback('path-reference');
    this.callbacks['body-reference'] = cstCallback('body-reference');
    this.callbacks['json-pointer'] = cstCallback('json-pointer');
    this.callbacks['reference-token'] = cstCallback('reference-token');
    this.callbacks['inputs-reference'] = cstCallback('inputs-reference');
    this.callbacks['inputs-name'] = cstCallback('inputs-name');
    this.callbacks['outputs-reference'] = cstCallback('outputs-reference');
    this.callbacks['outputs-name'] = cstCallback('outputs-name');
    this.callbacks['steps-reference'] = cstCallback('steps-reference');
    this.callbacks['workflows-reference'] = cstCallback('workflows-reference');
    this.callbacks['workflows-id'] = cstCallback('workflows-id');
    this.callbacks['workflows-field'] = cstCallback('workflows-field');
    this.callbacks['workflows-field-name'] = cstCallback('workflows-field-name');
    this.callbacks['source-reference'] = cstCallback('source-reference');
    this.callbacks['source-descriptions-name'] = cstCallback('source-descriptions-name');
    this.callbacks['source-descriptions-reference'] = cstCallback('source-descriptions-reference');
    this.callbacks['components-reference'] = cstCallback('components-reference');
    this.callbacks['components-type'] = cstCallback('components-type');
    this.callbacks['components-name'] = cstCallback('components-name');
    this.callbacks['name'] = cstCallback('name');
    this.callbacks['token'] = cstCallback('token');
    this.callbacks['steps-id'] = cstCallback('steps-id');
  }

  getTree() {
    const data = { stack: [], root: null };
    this.translate(data);
    return data.root;
  }
}

export default CSTTranslator;
