import { and, desc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { runs } from '@/lib/db/schema'
import type { RunStep } from '@/features/workflows/lib/run-step'

// Called from runWorkflowAction, before the task is triggered — so a row
// exists (status "running") even in the unlikely case the task never starts.
export async function createRun({
  orgId,
  workflowId,
}: {
  orgId: string
  workflowId: string
}) {
  const [run] = await db.insert(runs).values({ orgId, workflowId }).returning()

  return run
}

// Filled in right after tasks.trigger() resolves, once its handle.id is known.
export async function setRunTriggerId({
  id,
  orgId,
  triggerRunId,
}: {
  id: string
  orgId: string
  triggerRunId: string
}) {
  await db
    .update(runs)
    .set({ triggerRunId })
    .where(and(eq(runs.id, id), eq(runs.orgId, orgId)))
}

// Called once by the run-workflow task, from a single top-level try/catch —
// on the success path with status "completed", on any thrown error (missing
// graph, a failed step) with status "failed". If Trigger.dev retries the
// task, each attempt calls this again and simply overwrites the same row
// with its own outcome, so the row always reflects the most recent attempt.
export async function completeRun({
  id,
  orgId,
  status,
  steps,
  browserbaseSessionId,
  error,
}: {
  id: string
  orgId: string
  status: 'completed' | 'failed'
  steps: RunStep[]
  browserbaseSessionId?: string
  error?: string
}) {
  await db
    .update(runs)
    .set({
      status,
      steps,
      browserbaseSessionId,
      error,
      completedAt: new Date(),
    })
    .where(and(eq(runs.id, id), eq(runs.orgId, orgId)))
}

export function listRuns(orgId: string, workflowId: string) {
  return db
    .select()
    .from(runs)
    .where(and(eq(runs.workflowId, workflowId), eq(runs.orgId, orgId)))
    .orderBy(desc(runs.startedAt))
    .limit(20)
}

export async function getRun(orgId: string, id: string) {
  const [run] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.id, id), eq(runs.orgId, orgId)))

  return run
}
