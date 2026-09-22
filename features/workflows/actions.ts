'use server'

import * as Sentry from '@sentry/nextjs'
import { auth } from '@clerk/nextjs/server'
import { runs as triggerRuns, schedules } from '@trigger.dev/sdk'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { liveblocks } from '@/lib/liveblocks'
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflow,
  saveWorkflowGraph,
  setWorkflowSchedule,
} from '@/features/workflows/data'
import { listRuns, triggerWorkflowRun } from '@/features/workflows/runs-data'
import { scheduledWorkflowRunTask } from '@/features/workflows/tasks/scheduled-workflow-run'
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

  await liveblocks.deleteRoom(id)

  if (workflow.scheduleTriggerId) {
    await schedules.del(workflow.scheduleTriggerId)
  }

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

  const handle = await triggerWorkflowRun({ orgId, workflowId: id })

  Sentry.logger.info('Workflow run triggered', {
    workflowId: id,
    orgId,
    triggerRunId: handle.id,
    nodeCount: graph.nodes.length,
    hasAgentNode,
  })

  return handle
}

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

  await triggerRuns.cancel(runId)

  Sentry.logger.info('Workflow run cancelled', { runId, orgId })
}

export async function setWorkflowScheduleAction({
  id,
  cron,
  timezone,
}: {
  id: string
  cron: string
  timezone: string
}) {
  const { orgId, has } = await auth()
  if (!orgId) throw new Error('No active organization')

  Sentry.getIsolationScope().setAttributes({
    action: 'setWorkflowScheduleAction',
    orgId,
    workflowId: id,
  })

  const workflow = await getWorkflow(orgId, id)
  const hasAgentNode = workflow?.graph?.nodes.some(
    (node) => node.data.type === 'agent'
  )
  if (hasAgentNode && !has({ plan: 'pro' })) {
    Sentry.logger.warn('Schedule denied - Agent node requires Pro plan', {
      workflowId: id,
      orgId,
    })
    throw new Error('The Agent node requires the Pro plan.')
  }

  const schedule = await schedules.create({
    task: scheduledWorkflowRunTask.id,
    cron,
    timezone,
    externalId: id,
    deduplicationKey: id,
  })

  await setWorkflowSchedule({
    orgId,
    id,
    cron,
    timezone,
    scheduleTriggerId: schedule.id,
  })

  Sentry.logger.info('Workflow schedule set', {
    workflowId: id,
    orgId,
    cron,
    timezone,
  })

  revalidatePath(`/workflows/${id}`)
}

export async function removeWorkflowScheduleAction(id: string) {
  const { orgId, scheduleTriggerId } = await requireOwnSchedule(id)

  await schedules.del(scheduleTriggerId)
  await setWorkflowSchedule({
    orgId,
    id,
    cron: null,
    timezone: null,
    scheduleTriggerId: null,
  })

  Sentry.logger.info('Workflow schedule removed', { workflowId: id, orgId })

  revalidatePath(`/workflows/${id}`)
}

export async function getWorkflowScheduleAction(id: string) {
  const { orgId } = await auth()
  if (!orgId) throw new Error('No active organization')

  const workflow = await getWorkflow(orgId, id)
  return {
    cron: workflow?.scheduleCron ?? null,
    timezone: workflow?.scheduleTimezone ?? null,
  }
}

async function requireOwnSchedule(workflowId: string) {
  const { orgId } = await auth()
  if (!orgId) throw new Error('No active organization')

  const workflow = await getWorkflow(orgId, workflowId)
  if (!workflow?.scheduleTriggerId) {
    throw new Error('This workflow has no schedule to remove')
  }

  return { orgId, scheduleTriggerId: workflow.scheduleTriggerId }
}
