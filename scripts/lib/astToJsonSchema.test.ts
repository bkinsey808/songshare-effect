/* eslint-disable no-magic-numbers */
import { describe, it, expect } from 'vitest';
import { convertEffectAstToJsonSchema } from './astToJsonSchema';

describe('convertEffectAstToJsonSchema - basic shapes', () => {
  it('converts primitive string tokens', () => {
    expect(convertEffectAstToJsonSchema('string')).toEqual({ type: 'string' });
  });

  it('converts number/boolean constants', () => {
    expect(convertEffectAstToJsonSchema(42)).toEqual({ const: 42 });
    expect(convertEffectAstToJsonSchema(true)).toEqual({ const: true });
  });

  it('converts simple arrays', () => {
    const ast = [{ _tag: 'NumberKeyword' }];
    expect(convertEffectAstToJsonSchema(ast)).toEqual({ type: 'array', items: { type: 'number' } });
  });

  it('converts Literal AST to const + type', () => {
    const ast = { _tag: 'Literal', literal: 'x' };
    expect(convertEffectAstToJsonSchema(ast)).toEqual({ const: 'x', type: 'string' });
  });

  it('converts Union of literals to enum', () => {
    const ast = { _tag: 'Union', types: [{ _tag: 'Literal', literal: 'a' }, { _tag: 'Literal', literal: 'b' }] };
    expect(convertEffectAstToJsonSchema(ast)).toEqual({ enum: ['a', 'b'] });
  });

  it('converts Union of mixed types to anyOf', () => {
    const ast = { _tag: 'Union', types: [{ _tag: 'Literal', literal: 1 }, { _tag: 'StringKeyword' }] };
    expect(convertEffectAstToJsonSchema(ast)).toEqual({ anyOf: [{ type: 'string' }, { const: 1, type: 'number' }] });
  });
});

describe('convertEffectAstToJsonSchema - type literal / struct', () => {
  it('converts propertySignature style type literal with optionalness and index signatures', () => {
    const ast = {
      _tag: 'TypeLiteral',
      propertySignatures: [
        { name: 'id', isOptional: false, type: { _tag: 'NumberKeyword' } },
        { name: 'name', isOptional: true, type: { _tag: 'StringKeyword' } },
      ],
      indexSignatures: [{ type: { _tag: 'StringKeyword' } }],
    };

    const out = convertEffectAstToJsonSchema(ast);

    expect(out).toEqual({
      type: 'object',
      properties: { id: { type: 'number' }, name: { type: 'string' } },
      required: ['id'],
      additionalProperties: { type: 'string' },
    });
  });
});

describe('convertEffectAstToJsonSchema - additional node types', () => {
  it('converts Optional node to anyOf with null', () => {
    const ast = { _tag: 'Optional', type: { _tag: 'StringKeyword' } };
    expect(convertEffectAstToJsonSchema(ast)).toEqual({ anyOf: [{ type: 'string' }, { type: 'null' }] });
  });

  it('converts Intersection of two object types into merged properties', () => {
    const ast = {
      _tag: 'Intersection',
      types: [
        { _tag: 'TypeLiteral', propertySignatures: [{ name: 'propA', isOptional: false, type: { _tag: 'NumberKeyword' } }] },
        { _tag: 'TypeLiteral', propertySignatures: [{ name: 'propB', isOptional: true, type: { _tag: 'StringKeyword' } }] },
      ],
    };

    expect(convertEffectAstToJsonSchema(ast)).toEqual({
      type: 'object',
      properties: { propA: { type: 'number' }, propB: { type: 'string' } },
      required: ['propA'],
    });
  });

  it('converts Tuple with fixed elements to positional items', () => {
    const ast = { _tag: 'TupleType', elements: [{ type: { _tag: 'NumberKeyword' } }, { type: { _tag: 'StringKeyword' } }] };
    expect(convertEffectAstToJsonSchema(ast)).toEqual({ type: 'array', items: [{ type: 'number' }, { type: 'string' }], additionalItems: false });
  });

  it('converts Record to additionalProperties mapping', () => {
    const ast = { _tag: 'Record', value: { _tag: 'StringKeyword' } };
    expect(convertEffectAstToJsonSchema(ast)).toEqual({ type: 'object', additionalProperties: { type: 'string' } });
  });
});
