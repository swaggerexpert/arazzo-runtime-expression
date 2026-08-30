import { Parser } from 'apg-lite';

import Grammar from '../../../grammar.js';
import CSTTranslator from '../CSTTranslator.js';

const grammar = new Grammar();

export const transformCSTtoAST = (node, transformerMap) => {
  const transformer = transformerMap[node.type];
  if (!transformer) {
    throw new Error(`No transformer for CST node type: ${node.type}`);
  }
  return transformer(node);
};

// Best-effort, non-committal detection of a `$workflows.<workflowId>.steps.<stepId>`-shaped
// value nested inside an opaque `$sourceDescriptions.<name>.<reference>` reference (the
// dependsOn cross-document step-reference syntax). This reuses the primary grammar's
// `workflows-reference` rule as a secondary parse over just the `reference` substring — it
// never affects whether the outer `$sourceDescriptions.` expression itself is valid, and only
// enriches the AST when the opaque string happens to fully, unambiguously match the shape.
const tryParseWorkflowsStepsReference = (referenceText) => {
  const parser = new Parser();
  parser.ast = new CSTTranslator();

  let result;
  try {
    result = parser.parse(grammar, 'workflows-reference', referenceText);
  } catch {
    return undefined;
  }
  if (!result.success) return undefined;

  const tree = parser.ast.getTree();
  const stepsRefNode = tree.children.find((c) => c.type === 'workflows-steps-reference');
  if (!stepsRefNode) return undefined; // matched, but as inputs/outputs, not steps

  const workflowIdNode = tree.children.find((c) => c.type === 'workflow-id');
  const stepIdNode = stepsRefNode.children.find((c) => c.type === 'step-id');

  return {
    type: 'WorkflowsStepsExpression',
    workflowId: workflowIdNode.text,
    stepId: stepIdNode.text,
  };
};

const transformers = {
  ['expression'](node) {
    const text = node.text;

    // Literal expressions
    if (text === '$url') return { type: 'UrlExpression' };
    if (text === '$method') return { type: 'MethodExpression' };
    if (text === '$statusCode') return { type: 'StatusCodeExpression' };
    if (text === '$self') return { type: 'SelfExpression' };

    // Source expressions (request/response/message)
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
    if (text.startsWith('$message.')) {
      const sourceNode = node.children.find((c) => c.type === 'source');
      return {
        type: 'MessageExpression',
        source: transformCSTtoAST(sourceNode, transformers),
      };
    }

    // Reference expressions
    if (text.startsWith('$inputs.')) {
      const refNode = node.children.find((c) => c.type === 'inputs-reference');
      return transformCSTtoAST(refNode, transformers);
    }
    if (text.startsWith('$outputs.')) {
      const refNode = node.children.find((c) => c.type === 'outputs-reference');
      return transformCSTtoAST(refNode, transformers);
    }
    if (text.startsWith('$steps.')) {
      const refNode = node.children.find((c) => c.type === 'steps-reference');
      return transformCSTtoAST(refNode, transformers);
    }
    if (text.startsWith('$workflows.')) {
      const refNode = node.children.find((c) => c.type === 'workflows-reference');
      return transformCSTtoAST(refNode, transformers);
    }
    if (text.startsWith('$sourceDescriptions.')) {
      const refNode = node.children.find((c) => c.type === 'source-reference');
      return transformCSTtoAST(refNode, transformers);
    }
    if (text.startsWith('$components.')) {
      const refNode = node.children.find((c) => c.type === 'components-reference');
      return transformCSTtoAST(refNode, transformers);
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

  ['payload-reference'](node) {
    const jsonPointerNode = node.children.find((c) => c.type === 'json-pointer');
    if (!jsonPointerNode) {
      return { type: 'PayloadReference' };
    }
    return {
      type: 'PayloadReference',
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

  ['inputs-reference'](node) {
    const inputNameNode = node.children.find((c) => c.type === 'input-name');
    const jsonPointerNode = node.children.find((c) => c.type === 'json-pointer');

    const result = {
      type: 'InputsExpression',
      name: inputNameNode.text,
    };

    if (jsonPointerNode) {
      result.jsonPointer = transformCSTtoAST(jsonPointerNode, transformers);
    }

    return result;
  },

  ['outputs-reference'](node) {
    const outputNameNode = node.children.find((c) => c.type === 'output-name');
    const jsonPointerNode = node.children.find((c) => c.type === 'json-pointer');

    const result = {
      type: 'OutputsExpression',
      name: outputNameNode.text,
    };

    if (jsonPointerNode) {
      result.jsonPointer = transformCSTtoAST(jsonPointerNode, transformers);
    }

    return result;
  },

  ['steps-reference'](node) {
    const stepIdNode = node.children.find((c) => c.type === 'step-id');
    const outputNameNode = node.children.find((c) => c.type === 'output-name');
    const jsonPointerNode = node.children.find((c) => c.type === 'json-pointer');

    const result = {
      type: 'StepsExpression',
      stepId: stepIdNode.text,
      field: 'outputs',
      outputName: outputNameNode.text,
    };

    if (jsonPointerNode) {
      result.jsonPointer = transformCSTtoAST(jsonPointerNode, transformers);
    }

    return result;
  },

  ['workflows-reference'](node) {
    const workflowIdNode = node.children.find((c) => c.type === 'workflow-id');
    const stepsRefNode = node.children.find((c) => c.type === 'workflows-steps-reference');

    if (stepsRefNode) {
      const stepIdNode = stepsRefNode.children.find((c) => c.type === 'step-id');
      return {
        type: 'WorkflowsStepsExpression',
        workflowId: workflowIdNode.text,
        stepId: stepIdNode.text,
      };
    }

    const valueRefNode = node.children.find((c) => c.type === 'workflows-value-reference');
    const fieldNode = valueRefNode.children.find((c) => c.type === 'workflow-field');
    const fieldNameNode = valueRefNode.children.find((c) => c.type === 'workflow-field-name');
    const jsonPointerNode = valueRefNode.children.find((c) => c.type === 'json-pointer');

    const result = {
      type: 'WorkflowsExpression',
      workflowId: workflowIdNode.text,
      field: fieldNode.text,
      fieldName: fieldNameNode.text,
    };

    if (jsonPointerNode) {
      result.jsonPointer = transformCSTtoAST(jsonPointerNode, transformers);
    }

    return result;
  },

  ['source-reference'](node) {
    const sourceNameNode = node.children.find((c) => c.type === 'source-name');
    const referenceNode = node.children.find((c) => c.type === 'source-reference-id');

    const result = {
      type: 'SourceDescriptionsExpression',
      sourceName: sourceNameNode.text,
      reference: referenceNode.text,
    };

    const stepsReference = tryParseWorkflowsStepsReference(referenceNode.text);
    if (stepsReference) {
      result.stepsReference = stepsReference;
    }

    return result;
  },

  ['components-reference'](node) {
    const typeNode = node.children.find((c) => c.type === 'component-type');
    const nameNode = node.children.find((c) => c.type === 'component-name');

    return {
      type: 'ComponentsExpression',
      componentType: typeNode.text,
      componentName: nameNode.text,
    };
  },
};

export default transformers;
