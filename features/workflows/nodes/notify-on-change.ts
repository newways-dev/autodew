import { generateText, type LanguageModel } from 'ai'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

import { resend } from '@/lib/resend'
import { getLastCompletedRun } from '@/features/workflows/runs-data'
import { compareValue } from '@/features/workflows/lib/compare-value'
import { buildChangeSummaryPrompt } from '@/features/workflows/lib/change-summary-prompt'

const models: Record<string, LanguageModel> = {
  google: google('gemini-2.5-flash'),
  openai: openai('gpt-4o-mini'),
  anthropic: anthropic('claude-3-5-haiku-latest'),
}

export async function notifyOnChange({
  orgId,
  workflowId,
  nodeId,
  to,
  subject,
  value,
  provider,
}: {
  orgId: string
  workflowId: string
  nodeId: string
  to: string
  subject: string
  value: string
  provider: string
}) {
  const lastRun = await getLastCompletedRun({ orgId, workflowId })
  const previousStep = lastRun?.steps?.find((step) => step.nodeId === nodeId)
  const previousOutput = previousStep?.output as { value?: string } | undefined
  const previousValue = previousOutput?.value ?? null

  const result = compareValue({ previousValue, newValue: value })

  if (result.kind === 'unchanged') {
    return { changed: false, value }
  }

  const prompt = buildChangeSummaryPrompt({
    previousValue: result.kind === 'changed' ? result.previousValue : null,
    newValue: value,
  })

  const model = models[provider] ?? models.google

  const { text: summary } = await generateText({ model, prompt })

  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject,
    html: summary,
  })

  if (error || !data) {
    throw new Error(error?.message ?? 'Resend returned no email id')
  }

  return {
    changed: true,
    value,
    previousValue: result.kind === 'changed' ? result.previousValue : null,
    summary,
    emailId: data.id,
  }
}
