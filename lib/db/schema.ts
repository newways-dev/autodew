import type { Edge } from '@xyflow/react'
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import type { StepNodeType } from '@/features/workflows/nodes/node-registry'
import type { RunStep } from '@/features/workflows/lib/run-step'

// Canonical, server-readable snapshot of the flow. Mirrors React Flow's own
// shape 1:1 so a future executor can read it without remapping. Persisted by the
// Run action; the live editing copy still lives in the Liveblocks room.
export type WorkflowGraph = { nodes: StepNodeType[]; edges: Edge[] }

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(),
  name: text('name').notNull(),
  graph: jsonb('graph').$type<WorkflowGraph>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Workflow = typeof workflows.$inferSelect

// One row per workflow run. Created by runWorkflowAction just before it
// triggers the Trigger.dev task (so a run row exists even if the task never
// starts), then filled in by the task itself once it finishes. `steps`
// mirrors the same shape published live to run metadata during execution.
export const runs = pgTable('runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id, { onDelete: 'cascade' }),
  orgId: text('org_id').notNull(),
  // Trigger.dev's own run id (the `handle.id` from tasks.trigger), set right
  // after the task is triggered. Lets the history page link back to it or
  // offer cancel for a still-running row.
  triggerRunId: text('trigger_run_id'),
  status: text('status', {
    enum: ['running', 'completed', 'failed'],
  })
    .notNull()
    .default('running'),
  steps: jsonb('steps').$type<RunStep[]>(),
  browserbaseSessionId: text('browserbase_session_id'),
  error: text('error'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})

export type Run = typeof runs.$inferSelect
