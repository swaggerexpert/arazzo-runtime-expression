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
    this.callbacks['input-name'] = cstCallback('input-name');
    this.callbacks['outputs-reference'] = cstCallback('outputs-reference');
    this.callbacks['output-name'] = cstCallback('output-name');
    this.callbacks['steps-reference'] = cstCallback('steps-reference');
    this.callbacks['workflows-reference'] = cstCallback('workflows-reference');
    this.callbacks['workflow-id'] = cstCallback('workflow-id');
    this.callbacks['workflow-field'] = cstCallback('workflow-field');
    this.callbacks['workflow-field-name'] = cstCallback('workflow-field-name');
    this.callbacks['source-reference'] = cstCallback('source-reference');
    this.callbacks['source-name'] = cstCallback('source-name');
    this.callbacks['source-reference-id'] = cstCallback('source-reference-id');
    this.callbacks['components-reference'] = cstCallback('components-reference');
    this.callbacks['component-type'] = cstCallback('component-type');
    this.callbacks['component-name'] = cstCallback('component-name');
    this.callbacks['name'] = cstCallback('name');
    this.callbacks['token'] = cstCallback('token');
    this.callbacks['step-id'] = cstCallback('step-id');
  }

  getTree() {
    const data = { stack: [], root: null };
    this.translate(data);
    return data.root;
  }
}

export default CSTTranslator;
