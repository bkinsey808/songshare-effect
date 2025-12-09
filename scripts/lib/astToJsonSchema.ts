/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-type-assertion, @typescript-eslint/strict-boolean-expressions */
/**
 * Conservative mapping from Effect-TS AST nodes to JSON Schema fragments.
 * This module isolates the conversion logic so the top-level generator file
 * can remain smaller and easier to lint.
 */

export function effectAstProcessProps(src: unknown): { properties: Record<string, unknown>; required: string[] } {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  if (!src || typeof src !== 'object' || Array.isArray(src)) {
    return { properties, required };
  }

  const srcObj = src as Record<string, any>;
  for (const key of Object.keys(srcObj)) {
    const value = srcObj[key];

    // Detect propertySignature-like objects that carry `type` and `isOptional`
    const maybePropSignature =
      value && typeof value === 'object' && ('type' in value || 'isOptional' in value)
        ? (value as Record<string, any>)
        : undefined;

    const typeNode = maybePropSignature ? maybePropSignature['type'] ?? value : value;
    properties[key] = convertEffectAstToJsonSchema(typeNode);

    const optionalFlag = Boolean(
      maybePropSignature?.['isOptional'] === true ||
        (value && (value['optional'] === true || value['type'] === 'optional' || value['kind'] === 'optional')) ||
        false,
    );

    if (!optionalFlag) {
      required.push(key);
    }
  }

  return { properties, required };
}

// Merge JSON Schema annotations from Effect schema nodes (if present).
// Kept at module scope to avoid recreating the helper repeatedly.
// This module intentionally only provides a lightweight property-processing
// helper for effect AST objects. The main converter lives in the generator
// script to keep single-source deterministic behavior and because it is
// frequently updated during iterative AST->JSONSchema work.

// merge helper: JSON Schema annotations can be attached to Effect AST nodes
export function mergeJsonSchemaAnnotations(base: Record<string, unknown>, node: Record<string, any>): Record<string, unknown> {
  try {
    const annotations = node['annotations'] as Record<string, any> | undefined;
    const jsonSchema = annotations?.['Symbol(effect/annotation/JSONSchema)'] ?? annotations?.['Symbol(effect/annotation/JSON_SCHEMA)'];
    if (jsonSchema && typeof jsonSchema === 'object') {
      return { ...base, ...(jsonSchema as Record<string, unknown>) };
    }
  } catch {
    // ignore malformed annotation shapes
  }

  return base;
}

// Extracted handler for union nodes to reduce nesting in main converter.
export function handleUnionNode(node: Record<string, any>): unknown {
  const members = Array.isArray(node['types']) ? node['types'] : [];
  const literalValues: unknown[] = [];
  const nonLiteralSchemas: unknown[] = [];
  let hasUndefined = false;

  for (const member of members) {
    let handled = false;
    if (member && typeof member === 'object') {
      const tag = member['_tag'];
      if (tag === 'Literal' && 'literal' in member) {
        literalValues.push(member['literal']);
        handled = true;
      } else if (tag === 'UndefinedKeyword') {
        hasUndefined = true;
        handled = true;
      }
    }

    if (!handled) {
      nonLiteralSchemas.push(
        // Convert non-object or non-handled members to JSON Schema
        convertEffectAstToJsonSchema(member),
      );
    }
  }

  // oxlint-disable-next-line no-magic-numbers
  if (literalValues.length > 0 && nonLiteralSchemas.length === 0) {
    const out: Record<string, unknown> = { enum: literalValues };
    return mergeJsonSchemaAnnotations(out, node);
  }

    // Handle Optional node semantics: treat as the inner schema but also allow null
    export function handleOptionalNode(node: Record<string, any>): unknown {
      const innerNode = node['type'] ?? node['ast'] ?? node['inner'] ?? undefined;
      const innerSchema = innerNode ? convertEffectAstToJsonSchema(innerNode) : {};
      const anyOfArr: unknown[] = [];
      if (innerSchema && typeof innerSchema === 'object') {
        anyOfArr.push(innerSchema);
      }
      anyOfArr.push({ type: 'null' });
      return mergeJsonSchemaAnnotations({ anyOf: anyOfArr }, node);
    }

    // Handle intersection/merge nodes: try merging object members, fallback to allOf
    export function handleIntersectionNode(node: Record<string, any>): unknown {
      const members = Array.isArray(node['types']) ? node['types'] : [];
      const objectMembers: Record<string, unknown>[] = [];
      const nonObjectSchemas: unknown[] = [];

      for (const memberNode of members) {
        const converted = convertEffectAstToJsonSchema(memberNode);
        if (converted && typeof converted === 'object' && 'properties' in (converted as Record<string, any>)) {
          objectMembers.push(converted as Record<string, unknown>);
        } else {
          nonObjectSchemas.push(converted);
        }
      }

      // oxlint-disable-next-line no-magic-numbers
      if (objectMembers.length > 0 && nonObjectSchemas.length === 0) {
        const mergedProps: Record<string, unknown> = {};
        const requiredSet = new Set<string>();
        for (const objMember of objectMembers) {
          const props = (objMember['properties'] as Record<string, unknown>) ?? {};
          Object.assign(mergedProps, props);
          const reqList = Array.isArray(objMember['required']) ? (objMember['required'] as string[]) : [];
          for (const reqName of reqList) {
            requiredSet.add(reqName);
          }
        }
        const out: Record<string, unknown> = { type: 'object', properties: mergedProps };
        // oxlint-disable-next-line no-magic-numbers
        if (requiredSet.size > 0) {
          out['required'] = [...requiredSet];
        }
        return mergeJsonSchemaAnnotations(out, node);
      }

      const allOfArr = members.map((memberNode) => convertEffectAstToJsonSchema(memberNode));
      return mergeJsonSchemaAnnotations({ allOf: allOfArr }, node);
    }

    // Handle tuple nodes with fixed elements
    export function handleTupleNode(node: Record<string, any>): unknown {
      const elements = Array.isArray(node['elements']) ? node['elements'] : undefined;
      // oxlint-disable-next-line no-magic-numbers
      if (elements && elements.length > 0) {
        const items = elements.map((el) => convertEffectAstToJsonSchema(el['type'] ?? el));
        return mergeJsonSchemaAnnotations({ type: 'array', items, additionalItems: false }, node);
      }

      // oxlint-disable-next-line no-magic-numbers
      const rest = Array.isArray(node['rest']) && node['rest'].length > 0 ? node['rest'][0] : undefined;
      const items = rest ? convertEffectAstToJsonSchema(rest['type'] ?? rest) : {};
      return mergeJsonSchemaAnnotations({ type: 'array', items }, node);
    }

    // Handle Record/Map-like nodes that use key/value shapes
    export function handleRecordNode(node: Record<string, any>): unknown {
      const val = node['value'] ?? node['values'] ?? node['entries'] ?? node['schema'] ?? undefined;
      const inner = val ? convertEffectAstToJsonSchema(val) : {};
      return mergeJsonSchemaAnnotations({ type: 'object', additionalProperties: inner }, node);
    }

  // oxlint-disable-next-line no-magic-numbers
  const anyOfCandidates = nonLiteralSchemas.length > 0
    ? [...nonLiteralSchemas, ...literalValues.map((lit) => ({ const: lit, type: typeof lit }))]
    : literalValues.map((lit) => ({ const: lit, type: typeof lit }));
  const out: Record<string, unknown> = { anyOf: anyOfCandidates };
  if (hasUndefined) {
    out['anyOf'] = Array.isArray(out['anyOf']) ? [...(out['anyOf'] as unknown[]), { type: 'null' }] : out['anyOf'];
  }
  return mergeJsonSchemaAnnotations(out, node);
}
}

// Handler for type literal / struct-like nodes.
export function handleTypeLiteralNode(node: Record<string, any>): unknown {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  const propSignatures = Array.isArray(node['propertySignatures']) ? node['propertySignatures'] : [];

  for (const prop of propSignatures) {
    if (!prop || typeof prop !== 'object') {
      // Skip unexpected entries
      // handled by skipping the body
    } else {

    const name = String(prop['name']);
    const isOptional = Boolean(prop['isOptional'] === true);
    const pType = prop['type'] ?? prop['ast'] ?? undefined;
    properties[name] = convertEffectAstToJsonSchema(pType);
      if (!isOptional) {
        required.push(name);
      }
    }
  }

  const indexSignatures = Array.isArray(node['indexSignatures']) ? node['indexSignatures'] : [];
  const out: Record<string, unknown> = { type: 'object', properties };
  // oxlint-disable-next-line no-magic-numbers
  if (required.length > 0) {
    out['required'] = required;
  }

  // oxlint-disable-next-line no-magic-numbers
  if (indexSignatures.length > 0) {
    const [firstIndex] = indexSignatures;
    const valSchema = firstIndex && firstIndex['type'] ? convertEffectAstToJsonSchema(firstIndex['type']) : {};
    out['additionalProperties'] = valSchema;
  }

  return mergeJsonSchemaAnnotations(out, node);
}

// Main converter function. Kept at module scope so tests can exercise it.
export function convertEffectAstToJsonSchema(ast: unknown): unknown {
  if (ast === null || ast === undefined) {
    return {};
  }

  if (typeof ast === 'string') {
    return { type: ast.toLowerCase() };
  }

  if (typeof ast === 'number' || typeof ast === 'boolean') {
    return { const: ast };
  }

  if (Array.isArray(ast)) {
    const first = ast.find(() => true);
    const items = first ? convertEffectAstToJsonSchema(first) : {};
    return { type: 'array', items };
  }

  if (typeof ast === 'object') {
    const obj = ast as Record<string, any>;
    if (typeof obj['_tag'] === 'string') {
      const tag = String(obj['_tag']);
      switch (tag) {
        case 'Literal': {
          if ('literal' in obj) {
            const out: Record<string, unknown> = { const: obj['literal'], type: typeof obj['literal'] };
            return mergeJsonSchemaAnnotations(out, obj);
          }
          break;
        }
        case 'StringKeyword':
        case 'NumberKeyword':
        case 'BooleanKeyword':
        case 'UnknownKeyword':
        case 'AnyKeyword':
        case 'UndefinedKeyword':
        case 'NullKeyword': {
          if (tag === 'NullKeyword') {
            return { type: 'null' };
          }
          if (tag === 'UnknownKeyword' || tag === 'AnyKeyword') {
            return {};
          }
          const primitive = tag.replace('Keyword', '').toLowerCase();
          return mergeJsonSchemaAnnotations({ type: primitive }, obj);
        }
        case 'Union': {
          return handleUnionNode(obj);
        }
        case 'Optional': {
          return handleOptionalNode(obj);
        }
        case 'Intersection': {
          return handleIntersectionNode(obj);
        }
        case 'Refinement': {
          const base = obj['from'] ?? obj['ast'] ?? undefined;
          const baseSchema = base ? convertEffectAstToJsonSchema(base) : {};
          const out = typeof baseSchema === 'object' && baseSchema !== null ? { ...(baseSchema as Record<string, unknown>) } : {};
          return mergeJsonSchemaAnnotations(out, obj);
        }
        case 'Suspend': {
          const inner = obj['ast'] ?? undefined;
          if (inner !== undefined) {
            return convertEffectAstToJsonSchema(inner);
          }
          break;
        }
        case 'TupleType': {
          return handleTupleNode(obj);
        }
        case 'TypeLiteral': {
          return handleTypeLiteralNode(obj);
        }
        case 'Record': {
          return handleRecordNode(obj);
        }
        default: {
          break;
        }
      }
    }

    if ('literal' in obj && obj['literal'] !== undefined) {
      const out: Record<string, unknown> = { const: obj['literal'], type: typeof obj['literal'] };
      return mergeJsonSchemaAnnotations(out, obj);
    }

    const typeHint = (obj['type'] ?? obj['kind'] ?? obj['name']) as string | undefined;
    if (typeof typeHint === 'string') {
      const t = typeHint.toLowerCase();
      if (['string', 'number', 'boolean', 'null', 'any', 'unknown'].includes(t)) {
        if (t === 'null') {
          return { type: 'null' };
        }
        if (t === 'any' || t === 'unknown') {
          return {};
        }
        return { type: t };
      }

      if (t === 'array') {
        const items = obj['items'] ?? obj['element'] ?? (Array.isArray(obj['schema']) ? obj['schema'].find(() => true) : undefined);
        const out: Record<string, unknown> = { type: 'array', items: items ? convertEffectAstToJsonSchema(items) : {} };
        return mergeJsonSchemaAnnotations(out, obj);
      }

      if (['record', 'map', 'dict'].includes(t)) {
        const val = obj['value'] ?? obj['values'] ?? obj['entries'] ?? obj['schema'] ?? undefined;
        const out: Record<string, unknown> = { type: 'object', additionalProperties: val ? convertEffectAstToJsonSchema(val) : {} };
        return mergeJsonSchemaAnnotations(out, obj);
      }

      if (['struct', 'object', 'interface'].includes(t)) {
        const props = obj['props'] ?? obj['properties'] ?? obj['shape'] ?? obj['fields'] ?? obj['schema'] ?? undefined;
        const { properties: propObj, required: req } = effectAstProcessProps(props);
        const out: Record<string, unknown> = { type: 'object', properties: propObj };
        // oxlint-disable-next-line no-magic-numbers
        if (req.length > 0) {
          out['required'] = req;
        }

        return mergeJsonSchemaAnnotations(out, obj);
      }
    }

    const props = obj['props'] ?? obj['properties'] ?? obj['shape'] ?? obj['fields'] ?? undefined;
    if (props && typeof props === 'object' && !Array.isArray(props)) {
      const { properties: propObj, required: req } = effectAstProcessProps(props);
      const out: Record<string, unknown> = { type: 'object', properties: propObj };
      // oxlint-disable-next-line no-magic-numbers
      if (req.length > 0) {
        out['required'] = req;
      }
      return mergeJsonSchemaAnnotations(out, obj);
    }

    if ('items' in obj) {
      return { type: 'array', items: convertEffectAstToJsonSchema(obj['items']) };
    }

    return { type: 'object', properties: {}, additionalProperties: false, x_effect_ast: obj };
  }

  return { x_effect_ast: ast };
}

export default convertEffectAstToJsonSchema;
