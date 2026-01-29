const validExpressions = [
  // Literal expressions
  '$url',
  '$method',
  '$statusCode',

  // Request expressions - header
  '$request.header.accept',
  '$request.header.content-Type',
  '$request.header.X-Custom-Header',

  // Request expressions - query
  '$request.query.page',
  '$request.query.queryUrl',
  '$request.query.filter',

  // Request expressions - path
  '$request.path.id',
  '$request.path.userId',
  '$request.path.eventType',

  // Request expressions - body
  '$request.body',
  '$request.body#/url',
  '$request.body#/user/uuid',
  '$request.body#/data/items/0',
  '$request.body#/nested/deep/value',

  // Response expressions - header
  '$response.header.content-type',
  '$response.header.X-Response-Header',

  // Response expressions - body
  '$response.body',
  '$response.body#/status',
  '$response.body#/data/id',
  '$response.body#/results/0/name',

  // Inputs expression
  '$inputs.username',
  '$inputs.password',
  '$inputs.apiKey',

  // Outputs expression
  '$outputs.result',
  '$outputs.token',
  '$outputs.data',

  // Steps expression
  '$steps.stepId.outputs.value',
  '$steps.loginStep.outputs.sessionToken',
  '$steps.createUser.outputs.userId',
  '$steps.someStepId.outputs.pets#/0/id',
  '$steps.loginStep.outputs.user#/name',

  // Workflows expression
  '$workflows.myWorkflow.inputs.username',
  '$workflows.myWorkflow.outputs.result',
  '$workflows.authWorkflow.outputs.token',
  '$workflows.mainProcess.outputs.data',
  '$workflows.myWorkflow.outputs.result#/value',
  '$workflows.authWorkflow.outputs.token#/accessToken',

  // Source descriptions expression
  '$sourceDescriptions.petStore.getPets',
  '$sourceDescriptions.mainApi.createUser',
  '$sourceDescriptions.externalService.url',

  // Components expression
  '$components.parameters.petId',
  '$components.successActions.notifyUser',
  '$components.failureActions.logError',
];

export default validExpressions;
