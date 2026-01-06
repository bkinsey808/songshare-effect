# TypeGPU Implementation Guide

## Overview

This document explains our TypeGPU implementation journey, from initial setup to idiomatic best practices. It serves as both a reference for this codebase and a guide for future TypeGPU projects.

## What is TypeGPU?

[TypeGPU](https://docs.swmansion.com/TypeGPU/) is a TypeScript library that allows you to write GPU shaders in TypeScript instead of WGSL, with:

- **Type-safe GPU programming** - TypeScript types checked at compile time
- **"use gpu" directive** - Mark functions to run on the GPU, transpiled to WGSL at runtime
- **Automatic bind group management** - No manual binding boilerplate
- **Declarative pipeline API** - Clean, composable render pipeline creation
- **Standard library** - GPU-compatible math functions (`std.sin`, `std.mix`, etc.)
- **Shared CPU/GPU code** - Same functions run on both CPU and GPU

## Why TypeGPU?

### Before TypeGPU (Raw WebGPU)

```typescript
// Manual WGSL strings
const shaderCode = `
  @fragment
  fn main() -> @location(0) vec4f {
    return vec4f(1.0, 0.0, 0.0, 1.0);
  }
`;

// Manual bind group layouts
const bindGroupLayout = device.createBindGroupLayout({
  entries: [{ binding: 0, visibility: GPUShaderStage.FRAGMENT, ... }]
});

// Manual command encoding
const encoder = device.createCommandEncoder();
const pass = encoder.beginRenderPass(...);
// ... many lines of boilerplate
pass.end();
device.queue.submit([encoder.finish()]);
```

### After TypeGPU (Idiomatic)

```typescript
// TypeScript with type checking
const mainFragment = tgpu['~unstable'].fragmentFn({
  // Avoid `in: {}` for entry points: some TypeGPU/unplugin versions generate
  // an empty input struct which is invalid WGSL.
  in: { fragCoord: d.builtin.position },
  out: d.vec4f,
})((input) => {
  'use gpu';
  return d.vec4f(1, 0, 0, 1);
});

// Automatic binding and rendering
const pipeline = root['~unstable']
  .withVertex(mainVertex, {})
  .withFragment(mainFragment, { format })
  .createPipeline();

pipeline.withColorAttachment({ view }).draw(3);
```

## Our Implementation Journey

### Phase 1: Initial Attempt (Anti-Pattern)

**Problem**: Imported TypeGPU but used raw WebGPU commands.

```typescript
// ❌ BAD - TypeGPU imported but not used
import typegpuModule from "typegpu";

const buffer = root.createBuffer(f32, 0).$usage("uniform");

// Then used raw WebGPU commands
const encoder = device.createCommandEncoder();
const pass = encoder.beginRenderPass({
  colorAttachments: [{ view, clearValue: { r, g, b, a }, ... }]
});
pass.end();
device.queue.submit([encoder.finish()]);
```

**Issue**: This defeats the purpose of TypeGPU. We're just using it for device initialization.

### Phase 2: Hybrid Approach (Better, But Still Not Idiomatic)

**Problem**: Created TypeGPU functions but didn't execute them.

```typescript
// Created a function with "use gpu"
const computeColor = tgpu.fn([], vec4f)(() => {
  'use gpu';
  return vec4f(0.5, 0.4, 0.5, 1);
});

// But then voided it out!
void computeColor;

// And computed colors on CPU instead
const redComponent = 0.5 + 0.5 * Math.sin(timeValue);
```

**Issue**: The GPU function was never used. The actual rendering bypassed TypeGPU entirely.

### Phase 3: Idiomatic TypeGPU (Correct) ✅

**Key Changes**:

1. **Fixed resources** instead of manual buffers
2. **Pipeline API** instead of raw command encoding
3. **All shaders use "use gpu"** - no raw WGSL
4. **GPU math functions** from `typegpu/std`

```typescript
// 1. Create fixed uniform (automatically bound)
const timeUniform = root.createUniform(d.f32, 0);

// 2. Define reusable GPU function
const computeColor = tgpu.fn([d.f32], d.vec4f)((time) => {
  'use gpu';
  const red = 0.5 + 0.5 * std.sin(time);  // GPU math!
  return d.vec4f(red, 0.4, 1 - red, 1);
});

// 3. Fragment shader actually calls the function
const mainFragment = tgpu['~unstable'].fragmentFn({
  in: { fragCoord: d.builtin.position },
  out: d.vec4f,
})((input) => {
  'use gpu';
  const time = timeUniform.$;  // Access uniform
  return computeColor(time);   // Execute GPU function!
}).$uses({ timeUniform, computeColor });

// 4. Create pipeline (automatic bind groups)
const pipeline = root['~unstable']
  .withVertex(mainVertex, {})
  .withFragment(mainFragment, { format })
  .createPipeline();

// 5. Render with one clean call
pipeline.withColorAttachment({ view, clearValue, loadOp, storeOp }).draw(3);
```

## Key Concepts & Patterns

### 1. The "use gpu" Directive

**Purpose**: Marks functions to be transpiled to WGSL and executed on the GPU.

**Requirements**:

- Must be the first statement in the function body
- Requires [unplugin-typegpu](https://docs.swmansion.com/TypeGPU/tooling/unplugin-typegpu) build plugin
- Function can still be called from JavaScript (runs on CPU in that case)

**Example**:

```typescript
const myGpuFn = tgpu.fn([d.f32], d.vec4f)((value) => {
  'use gpu';  // Must be first!

  const scaled = value * 2;
  return d.vec4f(scaled, 0, 0, 1);
});
```

### 2. Data Type Imports

**Pattern**: Use namespace imports for data types and standard library.

```typescript
/* oxlint-disable-next-line import/no-namespace, id-length */
import * as d from "typegpu/data";
/* oxlint-disable-next-line import/no-namespace */
import * as std from "typegpu/std";
```

**Common Types**:

- `d.f32` - 32-bit float
- `d.u32` - 32-bit unsigned integer
- `d.vec2f`, `d.vec3f`, `d.vec4f` - Float vectors
- `d.builtin.vertexIndex` - Built-in vertex index
- `d.builtin.position` - Built-in position output

### 3. Fixed Resources (Automatic Binding)

**Best Practice**: Use `createUniform()`, `createReadonly()`, or `createMutable()` for buffers that don't change between render calls.

```typescript
// ✅ GOOD - Automatic binding
const timeUniform = root.createUniform(d.f32, 0);

// Access in shader
const time = timeUniform.$;

// ❌ AVOID - Manual binding (more boilerplate)
const timeBuffer = root.createBuffer(d.f32, 0).$usage('uniform');
const layout = tgpu.bindGroupLayout({ time: { uniform: d.f32 } });
const bindGroup = root.createBindGroup(layout, { time: timeBuffer });
```

**When Fixed Resources Shine**:

- Uniforms that update each frame (time, camera position)
- Global constants (light direction, material properties)
- Read-only lookup tables

### 4. The $uses Method

**Purpose**: Explicitly declare external dependencies for GPU functions.

```typescript
const from = d.vec3f(1, 0, 0);
const to = d.vec3f(0, 1, 0);

const getColor = (t: number) => {
  'use gpu';
  // References from outer scope
  return std.mix(from, to, t);
};
// Won't work! Must use $uses

// ✅ CORRECT
const getColorFn = tgpu.fn([d.f32], d.vec3f)((t) => {
  'use gpu';
  return std.mix(from, to, t);
}).$uses({ from, to });  // Explicit dependency declaration
```

**Rules**:

- Values referenced from outer scope must be in `$uses`
- Exceptions: Built-in types, other "use gpu" functions in the same file
- TypeGPU inlines constants at shader compilation time

### 5. Entry Functions (Vertex/Fragment/Compute)

**Pattern**: Use `tgpu['~unstable'].vertexFn()` and `.fragmentFn()`.

```typescript
const mainVertex = tgpu['~unstable'].vertexFn({
  in: { vertexIndex: d.builtin.vertexIndex },
  out: { position: d.builtin.position },
})((input, out) => {
  'use gpu';

  // Full-screen triangle positions indexed by @builtin(vertex_index)
  // Written without array indexing to avoid type/emit edge cases.
  const ZERO = 0;
  const ONE = 1;
  const MINUS_ONE = -1;
  const THREE = 3;

  const vertex0 = d.u32(ZERO);
  const vertex1 = d.u32(ONE);

  let clipX = d.f32(MINUS_ONE);
  let clipY = d.f32(MINUS_ONE);

  if (input.vertexIndex === vertex1) {
    clipX = d.f32(THREE);
    clipY = d.f32(MINUS_ONE);
  } else if (input.vertexIndex !== vertex0) {
    clipX = d.f32(MINUS_ONE);
    clipY = d.f32(THREE);
  }

  return out({ position: d.vec4f(clipX, clipY, d.f32(ZERO), d.f32(ONE)) });
});
```

**Revert note (if this ever fails in a future TypeGPU/WebGPU combo)**

If you hit a runtime shader compile error and need a known-good fallback, you can revert just the vertex shader to a raw-WGSL body string.

```typescript
const mainVertex = tgpu['~unstable'].vertexFn({
  in: { vertexIndex: d.builtin.vertexIndex },
  out: { position: d.builtin.position },
}) /* wgsl */ `{
  var pos = array<vec2f, 3>(
    vec2f(-1.0, -1.0),
    vec2f(3.0, -1.0),
    vec2f(-1.0, 3.0),
  );
  return Out(vec4f(pos[in.vertexIndex], 0.0, 1.0));
}`;
```

**IORecord Structure**:

- `in`: Input parameters (vertex index, fragment position, etc.)
- `out`: Output parameters (position, color, etc.)
- Return value must match `out` structure exactly

### 6. Pipeline Creation

**Declarative API**: Chain `.withVertex()` → `.withFragment()` → `.createPipeline()`.

```typescript
const pipeline = root['~unstable']
  .withVertex(mainVertex, {})
  .withFragment(mainFragment, { format })
  .createPipeline();

// Render
pipeline
  .withColorAttachment({
    view: textureView,
    clearValue: [0, 0, 0, 0],
    loadOp: 'clear',
    storeOp: 'store',
  })
  .draw(vertexCount);
```

**Benefits**:

- Automatic command encoder creation
- Automatic bind group binding
- Automatic command submission
- Type-safe attachment configuration

## Common Pitfalls & Solutions

### Pitfall 1: Mixing CPU and GPU Math

```typescript
// ❌ BAD - CPU math in animation loop
const red = 0.5 + 0.5 * Math.sin(timeValue);
```

**Solution**: Use GPU math in shaders.

```typescript
// ✅ GOOD - GPU math in shader
const computeColor = tgpu.fn([d.f32], d.vec4f)((time) => {
  'use gpu';
  const red = 0.5 + 0.5 * std.sin(time);  // GPU math!
  return d.vec4f(red, 0.4, 1 - red, 1);
});
```

### Pitfall 2: Forgetting $uses

```typescript
// ❌ BAD - Will throw error or produce incorrect shader
const color = d.vec4f(1, 0, 0, 1);
const getFn = tgpu.fn([], d.vec4f)(() => {
  'use gpu';
  return color;  // Error: color not in scope!
});
```

**Solution**: Always declare external dependencies.

```typescript
// ✅ GOOD
const getFn = tgpu.fn([], d.vec4f)(() => {
  'use gpu';
  return color;
}).$uses({ color });
```

### Pitfall 3: Using WGSL Instead of TypeScript

```typescript
// ❌ DISCOURAGED - Mixing paradigms
const mainVertex = tgpu['~unstable'].vertexFn({
  in: { vertexIndex: d.builtin.vertexIndex },
  out: { position: d.builtin.position },
}) /* wgsl */`{
  return Out(vec4f(0, 0, 0, 1));
}`;
```

**Solution**: Use "use gpu" consistently.

```typescript
// ✅ GOOD - Idiomatic TypeGPU
const mainVertex = tgpu['~unstable'].vertexFn({
  in: { vertexIndex: d.builtin.vertexIndex },
  out: { position: d.builtin.position },
})((input) => {
  'use gpu';
  return { position: d.vec4f(0, 0, 0, 1) };
});
```

**When WGSL is acceptable**: Complex matrix operations where operator overloading matters, or using features not yet supported by TypeGPU.

### Pitfall 4: Not Handling Array Bounds in TypeScript

```typescript
// ❌ BAD - TypeScript complains about undefined
const pos = positions[input.vertexIndex];
return { position: d.vec4f(pos.x, pos.y, 0, 1) };  // Error: pos possibly undefined
```

**Solution**: Add type guard (won't execute at runtime, just for TS).

```typescript
// ✅ GOOD
const pos = positions[input.vertexIndex];
if (pos === undefined) {
  return { position: d.vec4f(0, 0, 0, 1) };  // Type guard only
}
return { position: d.vec4f(pos.x, pos.y, 0, 1) };
```

### Pitfall 5: Manual Bind Groups When Not Needed

```typescript
// ❌ UNNECESSARY - Manual binding
const layout = tgpu.bindGroupLayout({ time: { uniform: d.f32 } });
const bindGroup = root.createBindGroup(layout, { time: timeBuffer });
pipeline.with(bindGroup).draw(3);
```

**Solution**: Use fixed resources for automatic binding.

```typescript
// ✅ GOOD - Automatic binding
const timeUniform = root.createUniform(d.f32, 0);
// TypeGPU handles bind groups automatically
pipeline.draw(3);
```

## Testing TypeGPU Code

### Unit Test Approach

Mock TypeGPU's pipeline API:

```typescript
const mockPipeline = {
  withColorAttachment: vi.fn(() => ({ draw: vi.fn() })),
};

const mockRoot = {
  device: {},
  createUniform: vi.fn(() => ({ write: vi.fn(), $: 0 })),
  '~unstable': {
    vertexFn: vi.fn(() => vi.fn(() => ({ $uses: vi.fn() }))),
    fragmentFn: vi.fn(() => vi.fn(() => ({ $uses: vi.fn() }))),
    withVertex: vi.fn(() => ({
      withFragment: vi.fn(() => ({
        createPipeline: vi.fn(() => mockPipeline),
      })),
    })),
  },
};
```

### Testing Philosophy

- **Unit tests**: Test the setup logic, not GPU execution
- **Visual tests**: Actually run the demo to verify rendering
- **Type tests**: Rely on TypeScript for compile-time correctness

## Performance Considerations

### What TypeGPU Optimizes

1. **Constant inlining**: Values in `$uses` are inlined at shader compilation time
2. **Dead code elimination**: Unused functions aren't included in final shader
3. **Automatic batching**: Fixed resources share bind groups

### When to Use Manual Optimization

- Very hot code paths (thousands of draw calls per frame)
- Complex compute shaders with many resources
- Need to control exact bind group layouts for cache coherency

For typical rendering (< 100 draw calls per frame), TypeGPU's automatic optimization is sufficient.

## The ~unstable Namespace

### Why It Exists

APIs under `['~unstable']` are:

- **Production-ready** and recommended by TypeGPU team
- **Subject to breaking changes** in future versions
- **The modern, idiomatic way** to use TypeGPU

### Current Unstable APIs We Use

1. `tgpu['~unstable'].vertexFn` - Entry function for vertex shaders
2. `tgpu['~unstable'].fragmentFn` - Entry function for fragment shaders
3. `root['~unstable'].withVertex()` - Declarative pipeline creation
4. `root['~unstable'].createGuardedComputePipeline()` - Compute pipelines

### Migration Strategy

When TypeGPU stabilizes these APIs:

1. They'll move out of `~unstable` namespace
2. A deprecation period will give time to migrate
3. Update imports to use stable API
4. Run tests to verify behavior unchanged

## Our Implementation Files

### Core Demo: `react/src/typegpu/runTypeGpuDemo.ts`

**Purpose**: Demonstrates idiomatic TypeGPU with animated color rendering.

**Key Features**:

- Full-screen triangle vertex shader (TypeScript with "use gpu")
- Animated fragment shader using `std.sin()` for GPU-side math
- Fixed uniform for time value with automatic binding
- Declarative pipeline creation
- Single render call per frame

### Test File: `react/src/typegpu/runTypeGpuDemo.test.ts`

**Purpose**: Unit tests for setup logic.

**Key Mocks**:

- TypeGPU module with pipeline API
- WebGPU context and device
- Navigator.gpu for browser compatibility
- GPUTextureUsage constants

## Best Practices Summary

### ✅ DO

- Use "use gpu" directive for all GPU functions
- Import `typegpu/data` as `d` and `typegpu/std` as `std`
- Use fixed resources (`createUniform`) for automatic binding
- Declare external dependencies with `$uses`
- Use TypeGPU's declarative pipeline API
- Write GPU math with `std.*` functions
- Test setup logic, not GPU execution
- Handle TypeScript array bounds with type guards

### ❌ DON'T

- Mix raw WebGPU commands with TypeGPU
- Use CPU math (`Math.*`) when GPU equivalent exists
- Forget `$uses` for external dependencies
- Create manual bind groups when fixed resources work
- Avoid "use gpu" in favor of WGSL (unless necessary)
- Expect `~unstable` APIs to never change
- Over-optimize before measuring performance

## Resources

- **Official Docs**: https://docs.swmansion.com/TypeGPU/
- **Examples**: https://docs.swmansion.com/TypeGPU/examples
- **GitHub**: https://github.com/software-mansion/TypeGPU
- **Build Plugin**: https://docs.swmansion.com/TypeGPU/tooling/unplugin-typegpu

## Known Limitations (TypeGPU v0.9.0)

### Critical: Empty Entry-Point Inputs Can Produce Invalid WGSL

**Problem**: Entry points that declare an empty input object (e.g. `in: {}`) can produce WGSL with an empty generated struct, which fails WGSL validation.

**Common symptom**:

- **Error**: `"structures must have at least one member"`

**Fix / Best Practice**:

- Avoid `in: {}` for `vertexFn` / `fragmentFn`.
- Prefer adding at least one input field. For full-screen effects, a built-in input is usually enough (e.g. `fragCoord: d.builtin.position` in the fragment shader).

**Note**: In this repository, we run a full-screen triangle using `@builtin(vertex_index)` and it works with the current TypeGPU/unplugin setup. If you hit empty-struct errors in your environment, fall back to a vertex buffer + `tgpu.vertexLayout(...)`.

### Workarounds

We attempted several approaches while diagnosing empty-struct WGSL errors. The key takeaways are:

- **Avoid `in: {}` for entry points** (can generate invalid WGSL)
- **Vertex buffers do work**, but you must use **TypeGPU vertex layouts** and bind them via the pipeline execution API

1. **❌ Empty entry-point input (`in: {}`)**: Can create an empty generated struct
2. **✅ Built-in inputs (working here)**: `vertexIndex` for vertex, `fragCoord` for fragment
3. **✅ Vertex buffers (working)**: Use `tgpu.vertexLayout(...)` for attributes in `.withVertex(...)`, then bind the layout + buffer via `.with(vertexLayout, vertexBuffer)` before `draw()`

### Recommendations

**For TypeGPU v0.9.0 Users**:

1. **Avoid `in: {}` for entry points**: Ensure entry points have at least one input field
2. **Use built-in inputs for full-screen effects**: `vertexIndex` and/or `fragCoord` are often enough
3. **Use vertex buffers + vertex layouts**: When you need real geometry/attributes
4. **Re-check on upgrade**: If TypeGPU/unplugin behavior changes, re-validate the demo and update this doc

**Example Workaround** (idiomatic TypeGPU pipeline + vertex layout):

```typescript
// Define a vertex layout (describes how a vertex buffer maps into shader inputs)
const positionLayout = tgpu.vertexLayout(d.arrayOf(d.vec2f), "vertex");

// Create a vertex buffer with explicit position data
const positionBuffer = root
  .createBuffer(d.arrayOf(d.vec2f, 3), [d.vec2f(-1, -1), d.vec2f(3, -1), d.vec2f(-1, 3)])
  .$usage("vertex");

// Vertex shader with regular input (not just built-ins)
const mainVertex = tgpu["~unstable"].vertexFn({
  in: { position: d.vec2f },  // Regular attribute, not a built-in
  out: { position: d.builtin.position },
})((input) => {
  "use gpu";
  return { position: d.vec4f(input.position.x, input.position.y, 0, 1) };
});

// Create pipeline: map shader input name -> vertexLayout attribute
const pipeline = root["~unstable"]
  .withVertex(mainVertex, { position: positionLayout.attrib })
  .withFragment(mainFragment, { format })
  .createPipeline();

// Execute: bind vertex layout + buffer, then draw
pipeline
  .with(positionLayout, positionBuffer)
  .withColorAttachment({ view, loadOp: "clear", storeOp: "store" })
  .draw(3);
```

### Reporting to TypeGPU Project

If you encounter this limitation, consider filing an issue at the TypeGPU repository with:

- The specific error: "structures must have at least one member"
- Minimal reproduction case showing built-in-only vertex shader
- Expected behavior: Transpiler should omit empty struct or add placeholder member

## Conclusion

TypeGPU transforms GPU programming from low-level WebGPU boilerplate into type-safe, composable TypeScript. The key is embracing its idiomatic patterns:

1. "use gpu" everywhere
2. Fixed resources for automatic binding
3. Declarative pipelines
4. GPU math from `typegpu/std`

**However**, be aware that empty entry-point inputs (e.g. `in: {}`) can produce invalid WGSL depending on your TypeGPU/unplugin version. Keep entry-point inputs non-empty and re-validate when upgrading.

By following these patterns and understanding the limitations, you can leverage TypeScript's type safety with GPU performance, while knowing when to use alternative approaches.
