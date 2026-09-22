import { logger, schedules } from '@trigger.dev/sdk'

import { getWorkflowById } from '@/features/workflows/data'
import { triggerWorkflowRun } from '@/features/workflows/runs-data'

export const scheduledWorkflowRunTask = schedules.task({
  id: 'scheduled-workflow-run',
  run: async (payload) => {
    const workflowId = payload.externalId
    if (!workflowId) {
      logger.warn('Scheduled run fired with no externalId, skipping')
      return
    }

    const workflow = await getWorkflowById(workflowId)
    if (!workflow?.graph) {
      logger.warn('Scheduled run found no runnable workflow, skipping', {
        workflowId,
      })
      return
    }

    logger.log(`Scheduled run firing for workflow ${workflow.name}`, {
      workflowId,
      cron: payload.timestamp,
    })

    await triggerWorkflowRun({ orgId: workflow.orgId, workflowId })
  },
})
