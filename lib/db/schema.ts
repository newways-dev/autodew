import type { Edge } from '@xyflow/react'
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { StepNodeType } from '@/features/workflows/nodes/node-registry'
import type { RunStep } from '@/features/workflows/lib/run-step'

export type WorkflowGraph = { nodes: StepNodeType[]; edges: Edge[] }

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: text('org_id').notNull(),
  name: text('name').notNull(),
  graph: jsonb('graph').$type<WorkflowGraph>(),
  scheduleCron: text('schedule_cron'),
  scheduleTimezone: text('schedule_timezone'),
  scheduleTriggerId: text('schedule_trigger_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Workflow = typeof workflows.$inferSelect

export const runs = pgTable('runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id')
    .notNull()
    .references(() => workflows.id, { onDelete: 'cascade' }),
  orgId: text('org_id').notNull(),
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
