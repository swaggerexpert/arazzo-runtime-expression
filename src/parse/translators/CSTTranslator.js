import { Ast as AST } from 'apg-lite';

import cstCallback from '../callbacks/cst.js';

class CSTTranslator extends AST {
  constructor() {
    super();

    this.callbacks['expression'] = cstCallback('expression');
    this.callbacks['source'] = cstCallback('source');
    this.callbacks['header-reference'] = cstCallback('header-reference');
    this.callbacks['query-reference'] = cstCallback('query-reference');
    this.callbacks['path-reference'] = cstCallback('path-reference');
    this.callbacks['body-reference'] = cstCallback('body-reference');
    this.callbacks['json-pointer'] = cstCallback('json-pointer');
    this.callbacks['reference-token'] = cstCallback('reference-token');
    this.callbacks['name'] = cstCallback('name');
    this.callbacks['token'] = cstCallback('token');
    // steps-name secondary grammar rules
    this.callbacks['steps-name'] = cstCallback('steps-name');
    this.callbacks['steps-id'] = cstCallback('steps-id');
    this.callbacks['steps-field'] = cstCallback('steps-field');
    this.callbacks['steps-sub-field'] = cstCallback('steps-sub-field');
    // workflows-name secondary grammar rules
    this.callbacks['workflows-name'] = cstCallback('workflows-name');
    this.callbacks['workflows-id'] = cstCallback('workflows-id');
    this.callbacks['workflows-field'] = cstCallback('workflows-field');
    this.callbacks['workflows-sub-field'] = cstCallback('workflows-sub-field');
    // source-descriptions-name secondary grammar rules
    this.callbacks['source-descriptions-name'] = cstCallback('source-descriptions-name');
    this.callbacks['source-descriptions-source-name'] = cstCallback('source-descriptions-source-name');
    this.callbacks['source-descriptions-reference'] = cstCallback('source-descriptions-reference');
    // components-name secondary grammar rules
    this.callbacks['components-name'] = cstCallback('components-name');
    this.callbacks['components-field'] = cstCallback('components-field');
    this.callbacks['components-sub-field'] = cstCallback('components-sub-field');
  }

  getTree() {
    const data = { stack: [], root: null };
    this.translate(data);
    return data.root;
  }
}

export default CSTTranslator;
