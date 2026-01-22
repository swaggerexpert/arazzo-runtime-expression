import { Parser } from 'apg-lite';

import Grammar from '../../../grammar.js';
import CSTTranslator from '../CSTTranslator.js';

const grammar = new Grammar();

const parseStepsName = (stepsName) => {
  const parser = new Parser();
  parser.ast = new CSTTranslator();
  const result = parser.parse(grammar, 'steps-name', stepsName);
  if (!result.success) {
    throw new Error(`Invalid steps expression name: ${stepsName}`);
  }
  return parser.ast.getTree();
};

const parseWorkflowsName = (workflowsName) => {
  const parser = new Parser();
  parser.ast = new CSTTranslator();
  const result = parser.parse(grammar, 'workflows-name', workflowsName);
  if (!result.success) {
    throw new Error(`Invalid workflows expression name: ${workflowsName}`);
  }
  return parser.ast.getTree();
};

const parseSourceDescriptionsName = (sourceDescriptionsName) => {
  const parser = new Parser();
  parser.ast = new CSTTranslator();
  const result = parser.parse(grammar, 'source-descriptions-name', sourceDescriptionsName);
  if (!result.success) {
    throw new Error(`Invalid source descriptions expression name: ${sourceDescriptionsName}`);
  }
  return parser.ast.getTree();
};

const parseComponentsName = (componentsName) => {
  const parser = new Parser();
  parser.ast = new CSTTranslator();
  const result = parser.parse(grammar, 'components-name', componentsName);
  if (!result.success) {
    throw new Error(`Invalid components expression name: ${componentsName}`);
  }
  return parser.ast.getTree();
};

export const transformCSTtoAST = (node, transformerMap) => {
  const transformer = transformerMap[node.type];
  if (!transformer) {
    throw new Error(`No transformer for CST node type: ${node.type}`);
  }
  return transformer(node);
};

const transformers = {
  ['expression'](node) {
    const text = node.text;

    // Literal expressions
    if (text === '$url') return { type: 'UrlExpression' };
    if (text === '$method') return { type: 'MethodExpression' };
    if (text === '$statusCode') return { type: 'StatusCodeExpression' };

    // Source expressions (request/response)
    if (text.startsWith('$request.')) {
      const sourceNode = node.children.find((c) => c.type === 'source');
      return {
        type: 'RequestExpression',
        source: transformCSTtoAST(sourceNode, transformers),
      };
    }
    if (text.startsWith('$response.')) {
      const sourceNode = node.children.find((c) => c.type === 'source');
      return {
        type: 'ResponseExpression',
        source: transformCSTtoAST(sourceNode, transformers),
      };
    }

    // Named expressions (raw name)
    const nameNode = node.children.find((c) => c.type === 'name');
    if (text.startsWith('$inputs.')) {
      return { type: 'InputsExpression', name: nameNode.text };
    }
    if (text.startsWith('$outputs.')) {
      return { type: 'OutputsExpression', name: nameNode.text };
    }
    if (text.startsWith('$steps.')) {
      const stepsNameCST = parseStepsName(nameNode.text);
      return transformCSTtoAST(stepsNameCST, transformers);
    }
    if (text.startsWith('$workflows.')) {
      const workflowsNameCST = parseWorkflowsName(nameNode.text);
      return transformCSTtoAST(workflowsNameCST, transformers);
    }
    if (text.startsWith('$sourceDescriptions.')) {
      const sourceDescriptionsNameCST = parseSourceDescriptionsName(nameNode.text);
      return transformCSTtoAST(sourceDescriptionsNameCST, transformers);
    }
    if (text.startsWith('$components.')) {
      const componentsNameCST = parseComponentsName(nameNode.text);
      return transformCSTtoAST(componentsNameCST, transformers);
    }
  },

  ['source'](node) {
    const child = node.children[0];
    return {
      type: 'Source',
      reference: transformCSTtoAST(child, transformers),
    };
  },

  ['header-reference'](node) {
    const tokenNode = node.children.find((c) => c.type === 'token');
    return { type: 'HeaderReference', token: tokenNode.text.toLowerCase() };
  },

  ['query-reference'](node) {
    const nameNode = node.children.find((c) => c.type === 'name');
    return { type: 'QueryReference', name: nameNode.text };
  },

  ['path-reference'](node) {
    const nameNode = node.children.find((c) => c.type === 'name');
    return { type: 'PathReference', name: nameNode.text };
  },

  ['body-reference'](node) {
    const jsonPointerNode = node.children.find((c) => c.type === 'json-pointer');
    if (!jsonPointerNode) {
      return { type: 'BodyReference' };
    }
    return {
      type: 'BodyReference',
      jsonPointer: transformCSTtoAST(jsonPointerNode, transformers),
    };
  },

  ['json-pointer'](node) {
    const referenceTokens = node.children
      .filter((c) => c.type === 'reference-token')
      .map((c) => transformCSTtoAST(c, transformers));
    return {
      type: 'JsonPointer',
      value: node.text,
      referenceTokens,
    };
  },

  ['reference-token'](node) {
    return { type: 'ReferenceToken', value: node.text };
  },

  // steps-name secondary grammar transformers
  ['steps-name'](node) {
    const stepIdNode = node.children.find((c) => c.type === 'steps-id');
    const fieldNode = node.children.find((c) => c.type === 'steps-field');
    const subFieldNode = node.children.find((c) => c.type === 'steps-sub-field');
    const jsonPointerNode = node.children.find((c) => c.type === 'json-pointer');

    const result = {
      type: 'StepsExpression',
      stepId: stepIdNode.text,
      field: fieldNode.text,
      outputName: subFieldNode.text,
    };

    if (jsonPointerNode) {
      result.jsonPointer = transformCSTtoAST(jsonPointerNode, transformers);
    }

    return result;
  },

  // workflows-name secondary grammar transformers
  ['workflows-name'](node) {
    const workflowIdNode = node.children.find((c) => c.type === 'workflows-id');
    const fieldNode = node.children.find((c) => c.type === 'workflows-field');
    const subFieldNode = node.children.find((c) => c.type === 'workflows-sub-field');
    const jsonPointerNode = node.children.find((c) => c.type === 'json-pointer');

    const result = {
      type: 'WorkflowsExpression',
      workflowId: workflowIdNode.text,
      field: fieldNode.text,
      subField: subFieldNode.text,
    };

    if (jsonPointerNode) {
      result.jsonPointer = transformCSTtoAST(jsonPointerNode, transformers);
    }

    return result;
  },

  // source-descriptions-name secondary grammar transformers
  ['source-descriptions-name'](node) {
    const sourceNameNode = node.children.find((c) => c.type === 'source-descriptions-source-name');
    const referenceNode = node.children.find((c) => c.type === 'source-descriptions-reference');

    return {
      type: 'SourceDescriptionsExpression',
      sourceName: sourceNameNode.text,
      reference: referenceNode.text,
    };
  },

  // components-name secondary grammar transformers
  ['components-name'](node) {
    const fieldNode = node.children.find((c) => c.type === 'components-field');
    const subFieldNode = node.children.find((c) => c.type === 'components-sub-field');

    return {
      type: 'ComponentsExpression',
      field: fieldNode.text,
      subField: subFieldNode.text,
    };
  },
};

export default transformers;
