/**
 * CST Node - Concrete Syntax Tree node
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export interface CSTNode {
  readonly type: string;
  readonly text: string;
  readonly start: number;
  readonly length: number;
  readonly children: CSTNode[];
}

/**
 * Translator base interface
 */
export interface Translator {
  getTree(): CSTNode | ASTNode | string | undefined;
}

/**
 * CSTTranslator - Produces Concrete Syntax Tree
 * Suitable for tools like IDEs or editors that need detailed syntax information.
 */
export class CSTTranslator implements Translator {
  constructor();
  getTree(): CSTNode;
}

/**
 * XMLTranslator - Produces XML string representation
 */
export class XMLTranslator implements Translator {
  constructor();
  getTree(): string;
}

/**
 * AST Node Types
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */

/**
 * $url - The entire request URL
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export interface UrlExpression {
  readonly type: 'UrlExpression';
}

/**
 * $method - The HTTP method
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export interface MethodExpression {
  readonly type: 'MethodExpression';
}

/**
 * $statusCode - The HTTP status code
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export interface StatusCodeExpression {
  readonly type: 'StatusCodeExpression';
}

/**
 * JSON Pointer reference token
 * https://datatracker.ietf.org/doc/html/rfc6901#section-3
 */
export interface ReferenceToken {
  readonly type: 'ReferenceToken';
  readonly value: string;
}

/**
 * JSON Pointer
 * https://datatracker.ietf.org/doc/html/rfc6901
 */
export interface JsonPointer {
  readonly type: 'JsonPointer';
  readonly value: string;
  readonly referenceTokens: ReferenceToken[];
}

/**
 * Header reference - $request.header.{token} or $response.header.{token}
 * https://datatracker.ietf.org/doc/html/rfc7230#section-3.2.6
 */
export interface HeaderReference {
  readonly type: 'HeaderReference';
  readonly token: string;
}

/**
 * Query reference - $request.query.{name}
 */
export interface QueryReference {
  readonly type: 'QueryReference';
  readonly name: string;
}

/**
 * Path reference - $request.path.{name}
 */
export interface PathReference {
  readonly type: 'PathReference';
  readonly name: string;
}

/**
 * Body reference - $request.body or $response.body with optional JSON pointer
 */
export interface BodyReference {
  readonly type: 'BodyReference';
  readonly jsonPointer?: JsonPointer;
}

/**
 * Union of all reference types
 */
export type Reference = HeaderReference | QueryReference | PathReference | BodyReference;

/**
 * Source - wrapper for reference in request/response expressions
 */
export interface Source {
  readonly type: 'Source';
  readonly reference: Reference;
}

/**
 * $request.{source} - Request expression
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export interface RequestExpression {
  readonly type: 'RequestExpression';
  readonly source: Source;
}

/**
 * $response.{source} - Response expression
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export interface ResponseExpression {
  readonly type: 'ResponseExpression';
  readonly source: Source;
}

/**
 * $inputs.{name} - Workflow inputs expression
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export interface InputsExpression {
  readonly type: 'InputsExpression';
  readonly name: string;
}

/**
 * $outputs.{name} - Workflow outputs expression
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export interface OutputsExpression {
  readonly type: 'OutputsExpression';
  readonly name: string;
}

/**
 * $steps.{stepId}.outputs.{outputName} - Step outputs expression
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export interface StepsExpression {
  readonly type: 'StepsExpression';
  readonly stepId: string;
  readonly field: 'outputs';
  readonly outputName: string;
  readonly jsonPointer?: JsonPointer;
}

/**
 * $workflows.{workflowId}.{field}.{subField} - Workflows expression
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export interface WorkflowsExpression {
  readonly type: 'WorkflowsExpression';
  readonly workflowId: string;
  readonly field: 'inputs' | 'outputs';
  readonly subField: string;
  readonly jsonPointer?: JsonPointer;
}

/**
 * $sourceDescriptions.{sourceName}.{reference} - Source descriptions expression
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export interface SourceDescriptionsExpression {
  readonly type: 'SourceDescriptionsExpression';
  readonly sourceName: string;
  readonly reference: string;
}

/**
 * $components.{field}.{subField} - Components expression
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export interface ComponentsExpression {
  readonly type: 'ComponentsExpression';
  readonly field: 'parameters' | 'successActions' | 'failureActions';
  readonly subField: string;
}

/**
 * Union of all AST node types
 */
export type ASTNode =
  | UrlExpression
  | MethodExpression
  | StatusCodeExpression
  | RequestExpression
  | ResponseExpression
  | InputsExpression
  | OutputsExpression
  | StepsExpression
  | WorkflowsExpression
  | SourceDescriptionsExpression
  | ComponentsExpression;

/**
 * ASTTranslator - Produces Abstract Syntax Tree
 * Suitable for implementations that need to analyze or evaluate expressions.
 */
export class ASTTranslator implements Translator {
  constructor();
  getTree(): ASTNode;
}

/**
 * Trace - For debugging parse operations
 */
export class Trace {
  constructor();
  displayTrace(): string;
  inferExpectations(): Expectations;
}

/**
 * Expectations - Array of expected tokens at parse failure point
 */
export class Expectations extends Array<string> {
  toString(): string;
}

/**
 * Stats - For collecting parse statistics
 */
export class Stats {
  constructor();
  displayStats(): string;
}

/**
 * Parse options
 */
export interface ParseOptions<T extends Translator | null = Translator | null> {
  readonly stats?: boolean;
  readonly trace?: boolean;
  readonly translator?: T;
}

/**
 * Parse result metadata
 */
export interface ParseResultMeta {
  readonly success: boolean;
  readonly state: number;
  readonly stateName: string;
  readonly length: number;
  readonly matched: number;
  readonly maxMatched: number;
  readonly maxTreeDepth: number;
  readonly nodeHits: number;
}

/**
 * Parse result
 */
export interface ParseResult<T = CSTNode | ASTNode | string | undefined> {
  readonly result: ParseResultMeta;
  readonly tree: T;
  readonly stats: Stats | undefined;
  readonly trace: Trace | undefined;
}

/**
 * Parse a runtime expression with ASTTranslator
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export function parse(runtimeExpression: string, options: ParseOptions<ASTTranslator>): ParseResult<ASTNode>;

/**
 * Parse a runtime expression with XMLTranslator
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export function parse(runtimeExpression: string, options: ParseOptions<XMLTranslator>): ParseResult<string>;

/**
 * Parse a runtime expression with CSTTranslator
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export function parse(runtimeExpression: string, options: ParseOptions<CSTTranslator>): ParseResult<CSTNode>;

/**
 * Parse a runtime expression with null translator (validation only)
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export function parse(runtimeExpression: string, options: ParseOptions<null>): ParseResult<undefined>;

/**
 * Parse a runtime expression with default ASTTranslator
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export function parse(runtimeExpression: string, options?: ParseOptions): ParseResult<ASTNode>;

/**
 * Test if a string is a valid runtime expression
 * https://spec.openapis.org/arazzo/latest.html#runtime-expressions
 */
export function test(runtimeExpression: string): boolean;

/**
 * Extract runtime expressions from a string containing embedded {expression} patterns
 */
export function extract(str: string): string[];

/**
 * Grammar - ABNF grammar for runtime expressions
 */
export class Grammar {
  constructor();
  grammarObject: string;
  rules: Rule[];
  udts: UDT[];
  toString(): string;
}

export interface Rule {
  name: string;
  lower: string;
  index: number;
  isBkr: boolean;
  opcodes?: Opcode[];
}

export type Opcode =
  | { type: 1; children: number[] }
  | { type: 2; children: number[] }
  | { type: 3; min: number; max: number }
  | { type: 4; index: number }
  | { type: 5; min: number; max: number }
  | { type: 6 | 7; string: number[] };

export type UDT = Record<string, never>;

/**
 * Error options
 */
export interface ArazzoRuntimeExpressionErrorOptions extends ErrorOptions {
  [key: string]: unknown;
}

/**
 * Base error class for all Arazzo Runtime Expression errors
 */
export class ArazzoRuntimeExpressionError extends Error {
  constructor(message?: string, options?: ArazzoRuntimeExpressionErrorOptions);
  override name: string;
  override cause?: unknown;
}

/**
 * Error thrown when parsing fails
 */
export class ArazzoRuntimeExpressionParseError extends ArazzoRuntimeExpressionError {
  runtimeExpression?: string;
}
