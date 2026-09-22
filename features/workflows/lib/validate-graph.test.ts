import { describe, expect, it } from 'vitest'

import { validateGraph } from './validate-graph'
import type { StepNodeType } from '../nodes/node-registry'
import type { Edge } from '@xyflow/react'

// --- Test helpers -----------------------------------------------------
// validateGraph only reads `data.kind`, `id`, `source` and `target` — it
// never touches `position` or field `values`. We still have to satisfy
// TypeScript's Node/Edge types, so these helpers fill in throwaway values
// for everything the function doesn't care about, and let the test itself
// only specify what actually matters (id + kind, or source/target).
function makeNode(id: string, kind: 'trigger' | 'action'): StepNodeType {
  return {
    id,
    type: 'step',
    position: { x: 0, y: 0 },
    data: {
      type: kind === 'trigger' ? 'start' : 'open-url',
      kind,
      title: id,
      values: {},
    },
  }
}

function makeEdge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target }
}

// --- The lesson ---------------------------------------------------------
// `describe` groups related tests under one label (shows up in the output
// as a heading). `it` (same as `test`) is one single test case: a name plus
// a function. Inside, the usual shape is Arrange (set up the input),
// Act (call the function), Assert (check the result with `expect`).

describe('validateGraph', () => {
  it('returns no problems for a valid, connected, acyclic graph', () => {
    // Arrange: one Start node feeding one action node.
    const nodes = [makeNode('start', 'trigger'), makeNode('open-url', 'action')]
    const edges = [makeEdge('start', 'open-url')]

    // Act
    const problems = validateGraph({ nodes, edges })

    // Assert
    expect(problems).toEqual([])
  })

  it('requires exactly one Start trigger', () => {
    const nodes = [makeNode('open-url', 'action')] // zero triggers
    const edges = [makeEdge('open-url', 'open-url')]

    const problems = validateGraph({ nodes, edges })

    // toContain checks the array has this exact string as one of its items,
    // without caring about the other problems that might also be present.
    expect(problems).toContain(
      'A workflow needs exactly one Start trigger (found 0).'
    )
  })

  it('rejects a graph with two Start triggers', () => {
    const nodes = [
      makeNode('start-a', 'trigger'),
      makeNode('start-b', 'trigger'),
      makeNode('open-url', 'action'),
    ]
    const edges = [makeEdge('start-a', 'open-url')]

    const problems = validateGraph({ nodes, edges })

    expect(problems).toContain(
      'A workflow needs exactly one Start trigger (found 2).'
    )
  })

  it('requires at least one edge', () => {
    const nodes = [makeNode('start', 'trigger'), makeNode('open-url', 'action')]

    const problems = validateGraph({ nodes, edges: [] })

    expect(problems).toContain('Connect your nodes before running.')
  })

  it('rejects a graph with a cycle', () => {
    const nodes = [
      makeNode('start', 'trigger'),
      makeNode('a', 'action'),
      makeNode('b', 'action'),
    ]
    // a -> b -> a is a cycle between the two action nodes.
    const edges = [
      makeEdge('start', 'a'),
      makeEdge('a', 'b'),
      makeEdge('b', 'a'),
    ]

    const problems = validateGraph({ nodes, edges })

    expect(problems).toContain(
      'Workflow has a cycle — remove the loop before running.'
    )
  })
})
