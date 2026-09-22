import type { NodeType } from '@/features/workflows/nodes/node-registry'

// One entry per node a run walks. Published live to Trigger.dev run metadata
// while a run is in progress, and persisted as-is into the `runs` table once
// it finishes — so the history page renders the exact same shape the live
// console does. Moved out of run-workflow.ts so lib/db/schema.ts can use the
// type without importing the task module (which itself imports back down
// into features/workflows/data.ts -> lib/db/schema.ts, which would be a
// circular import).
export type RunStep = {
  nodeId: string
  type: NodeType
  title: string
  status: 'pending' | 'running' | 'done' | 'failed'
  durationMs?: number
  output?: unknown
  error?: string
}
