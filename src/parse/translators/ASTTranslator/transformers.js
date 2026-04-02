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
    if (text === '$self') return { type: 'SelfExpression' };

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

    // Reference expressions (secondary grammar parsing)
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
    const inputNameNode = node.children.find((c) => c.type === 'inputs-name');
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
    const outputNameNode = node.children.find((c) => c.type === 'outputs-name');
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
    const stepIdNode = node.children.find((c) => c.type === 'steps-id');
    const outputNameNode = node.children.find((c) => c.type === 'outputs-name');
    const jsonPointerNode = node.children.find((c) => c.type === 'json-pointer');

    const result = {
      type: 'StepsExpression',
      stepId: stepIdNode.text,
      outputName: outputNameNode.text,
    };

    if (jsonPointerNode) {
      result.jsonPointer = transformCSTtoAST(jsonPointerNode, transformers);
    }

    return result;
  },

  ['workflows-reference'](node) {
    const workflowIdNode = node.children.find((c) => c.type === 'workflows-id');
    const fieldNode = node.children.find((c) => c.type === 'workflows-field');
    const fieldNameNode = node.children.find((c) => c.type === 'workflows-field-name');
    const jsonPointerNode = node.children.find((c) => c.type === 'json-pointer');

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
    const sourceNameNode = node.children.find((c) => c.type === 'source-descriptions-name');
    const referenceNode = node.children.find((c) => c.type === 'source-descriptions-reference');

    return {
      type: 'SourceDescriptionsExpression',
      sourceName: sourceNameNode.text,
      reference: referenceNode.text,
    };
  },

  ['components-reference'](node) {
    const typeNode = node.children.find((c) => c.type === 'components-type');
    const nameNode = node.children.find((c) => c.type === 'components-name');

    return {
      type: 'ComponentsExpression',
      componentType: typeNode.text,
      componentName: nameNode.text,
    };
  },
};

export default transformers;
