import { and, desc, eq } from 'drizzle-orm'
import { tasks } from '@trigger.dev/sdk'

import { db } from '@/lib/db'
import { runs } from '@/lib/db/schema'
import type { RunStep } from '@/features/workflows/lib/run-step'
import type { runWorkflowTask } from '@/features/workflows/tasks/run-workflow'

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

// The one place a run is actually kicked off — used by the Run button
// (after its own auth/graph checks) and by the scheduled task (which has no
// Clerk session to check). Creates the row first so one exists even if
// triggering itself fails, then triggers the task with that row's id and
// records Trigger.dev's own run id once the trigger call resolves.
export async function triggerWorkflowRun({
  orgId,
  workflowId,
}: {
  orgId: string
  workflowId: string
}) {
  const run = await createRun({ orgId, workflowId })

  const handle = await tasks.trigger<typeof runWorkflowTask>(
    'run-workflow',
    { workflowId, orgId, runId: run.id },
    { tags: [`workflow:${workflowId}`] }
  )

  await setRunTriggerId({ id: run.id, orgId, triggerRunId: handle.id })

  return handle
}

export function listRuns(orgId: string, workflowId: string) {
  return db
    .select()
    .from(runs)
    .where(and(eq(runs.workflowId, workflowId), eq(runs.orgId, orgId)))
    .orderBy(desc(runs.startedAt))
    .limit(20)
}

export async function getLastCompletedRun({
  orgId,
  workflowId,
}: {
  orgId: string
  workflowId: string
}) {
  const [run] = await db
    .select()
    .from(runs)
    .where(
      and(
        eq(runs.workflowId, workflowId),
        eq(runs.orgId, orgId),
        eq(runs.status, 'completed')
      )
    )
    .orderBy(desc(runs.startedAt))
    .limit(1)

  return run
}

export async function getRun(orgId: string, id: string) {
  const [run] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.id, id), eq(runs.orgId, orgId)))

  return run
}
