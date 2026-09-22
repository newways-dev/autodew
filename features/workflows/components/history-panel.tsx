'use client'

import { useEffect, useRef, useState } from 'react'
import prettyMilliseconds from 'pretty-ms'
import { ChevronRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

import { NodeIcon } from '@/features/workflows/components/node-icon'
import { listWorkflowRunHistoryAction } from '@/features/workflows/actions'
import { useLiveRun } from '@/features/workflows/components/workflow-runs-provider'
import type { Run } from '@/lib/db/schema'

// Badge color per status — same red/neutral vocabulary as the rest of the
// console (StepRow uses text-destructive for a failed step).
function StatusBadge({ status }: { status: Run['status'] }) {
  if (status === 'running') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Spinner className="size-3" />
        Running
      </Badge>
    )
  }
  if (status === 'failed') {
    return <Badge variant="destructive">Failed</Badge>
  }
  return <Badge variant="outline">Completed</Badge>
}

// One past run: a summary row (time, status, duration) that expands to show
// its steps, read-only — no selection wiring into the live console, this is
// its own self-contained history rather than a second way to drive it.
function RunRow({ run }: { run: Run }) {
  const [open, setOpen] = useState(false)
  const steps = run.steps ?? []
  const durationMs =
    run.completedAt && run.startedAt
      ? new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()
      : undefined

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent">
        <ChevronRight
          className={cn('size-3.5 shrink-0 transition-transform', open && 'rotate-90')}
        />
        <span className="text-muted-foreground">
          {new Date(run.startedAt).toLocaleString()}
        </span>
        <StatusBadge status={run.status} />
        {durationMs != null && (
          <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
            {prettyMilliseconds(durationMs)}
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-0.5 py-1 pl-7">
        {steps.length === 0 && (
          <p className="px-2 py-1 text-xs text-muted-foreground">
            No steps recorded for this run.
          </p>
        )}
        {steps.map((step) => (
          <div
            key={step.nodeId}
            className="flex items-center gap-2 rounded-md px-2 py-1 text-xs"
          >
            <NodeIcon type={step.type} />
            <span
              className={cn(
                'truncate font-medium',
                step.status === 'failed' && 'text-destructive'
              )}
            >
              {step.title}
            </span>
            {step.durationMs != null && (
              <span className="ml-auto shrink-0 text-muted-foreground tabular-nums">
                {prettyMilliseconds(step.durationMs)}
              </span>
            )}
          </div>
        ))}
        {run.error && (
          <p className="mt-1 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {run.error}
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

// The History tab: every persisted run for this workflow, newest first. Reads
// from Postgres via a server action rather than Trigger.dev's realtime feed —
// it survives their retention window and doesn't need a live subscription.
export function HistoryPanel({ workflowId }: { workflowId: string }) {
  const [runs, setRuns] = useState<Run[] | null>(null)

  // The run currently in flight on the canvas, if any. Used only to know when
  // one just finished, so the list refetches without polling on a timer.
  const liveRun = useLiveRun()

  const refresh = () => {
    listWorkflowRunHistoryAction(workflowId).then(setRuns)
  }

  useEffect(refresh, [workflowId])

  // liveRun flips from a run object to undefined the moment it finishes —
  // that transition is the signal to pull the now-completed row from
  // Postgres. A ref rather than state: this is bookkeeping for the effect
  // itself, not something the render needs to read.
  const wasLiveRef = useRef(false)
  useEffect(() => {
    if (liveRun) {
      wasLiveRef.current = true
      return
    }
    if (!wasLiveRef.current) return
    wasLiveRef.current = false
    // The task's own completeRun() write can land a moment after the run
    // stops being "live" in Trigger.dev's eyes, so give it a beat.
    const timeout = setTimeout(refresh, 1500)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveRun])

  if (runs === null) {
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner className="size-4 text-muted-foreground" />
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
        No runs yet
      </div>
    )
  }

  return (
    <div className="flex size-full flex-col gap-0.5 overflow-y-auto p-2">
      {runs.map((run) => (
        <RunRow key={run.id} run={run} />
      ))}
    </div>
  )
}
