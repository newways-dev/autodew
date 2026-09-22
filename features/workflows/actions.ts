'use server'

import * as Sentry from '@sentry/nextjs'
import { auth } from '@clerk/nextjs/server'
import { runs, tasks } from '@trigger.dev/sdk'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { runWorkflowTask } from '@/features/workflows/tasks/run-workflow'
import { liveblocks } from '@/lib/liveblocks'
import {
  createWorkflow,
  deleteWorkflow,
  saveWorkflowGraph,
} from '@/features/workflows/data'
import {
  createRun,
  listRuns,
  setRunTriggerId,
} from '@/features/workflows/runs-data'
import { WorkflowGraph } from '@/lib/db/schema'

export async function createWorkflowAction(name: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error('No active organization')
  }

  Sentry.getIsolationScope().setAttributes({
    action: 'createWorkflowAction',
    orgId,
  })

  const workflow = await createWorkflow(orgId, name)

  Sentry.logger.info('Workflow created', { workflowId: workflow.id, orgId })

  revalidatePath('/workflows', 'layout')
  redirect(`/workflows/${workflow.id}`)
}

export async function deleteWorkflowAction(id: string) {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error('No active organization')
  }

  Sentry.getIsolationScope().setAttributes({
    action: 'deleteWorkflowAction',
    orgId,
    workflowId: id,
  })

  const workflow = await deleteWorkflow(orgId, id)

  if (!workflow) {
    Sentry.logger.warn('Workflow delete skipped — not found', {
      workflowId: id,
      orgId,
    })
    throw new Error('Workflow not found')
  }

  // The workflow id doubles as its Liveblocks room id — clean it up too.
  await liveblocks.deleteRoom(id)

  Sentry.logger.info('Workflow deleted', { workflowId: id, orgId })

  revalidatePath('/workflows', 'layout')
  redirect('/')
}

export async function runWorkflowAction({
  id,
  graph,
}: {
  id: string
  graph: WorkflowGraph
}) {
  const { orgId, has } = await auth()

  if (!orgId) {
    throw new Error('No active organization')
  }

  // The Agent node is Pro-only. Enforce it here rather than in the run task: the
  // action holds the Clerk session (and has()), while the Trigger.dev task runs
  // with no auth context. has() evaluates the active org, confirmed above.
  Sentry.getIsolationScope().setAttributes({
    action: 'runWorkflowAction',
    orgId,
    workflowId: id,
  })

  const hasAgentNode = graph.nodes.some((node) => node.data.type === 'agent')
  if (hasAgentNode && !has({ plan: 'pro' })) {
    Sentry.logger.warn('Workflow run denied — Agent node requires Pro plan', {
      workflowId: id,
      orgId,
    })
    throw new Error('The Agent node requires the Pro plan.')
  }

  try {
    await saveWorkflowGraph({ orgId, id, graph })
  } catch (error) {
    Sentry.logger.warn('Workflow run blocked — graph validation failed', {
      workflowId: id,
      orgId,
    })
    throw error
  }

  // Created before the task is triggered so a "running" row exists even if
  // triggering itself is what fails. The task gets this row's id in its
  // payload so it knows which run to complete without looking anything up.
  const run = await createRun({ orgId, workflowId: id })

  const handle = await tasks.trigger<typeof runWorkflowTask>(
    'run-workflow',
    { workflowId: id, orgId, runId: run.id },
    { tags: [`workflow:${id}`] }
  )

  await setRunTriggerId({ id: run.id, orgId, triggerRunId: handle.id })

  Sentry.logger.info('Workflow run triggered', {
    workflowId: id,
    orgId,
    runId: run.id,
    triggerRunId: handle.id,
    nodeCount: graph.nodes.length,
    hasAgentNode,
  })

  return handle
}

// Backs the History tab — the persisted run log in Postgres, independent of
// Trigger.dev's own retention and available without a realtime subscription.
export async function listWorkflowRunHistoryAction(workflowId: string) {
  const { orgId } = await auth()
  if (!orgId) throw new Error('No active organization')

  return listRuns(orgId, workflowId)
}

export async function cancelWorkflowRunAction(runId: string) {
  const { orgId } = await auth()
  if (!orgId) throw new Error('No active organization')

  Sentry.getIsolationScope().setAttributes({
    action: 'cancelWorkflowRunAction',
    orgId,
    runId,
  })

  await runs.cancel(runId)

  Sentry.logger.info('Workflow run cancelled', { runId, orgId })
}
