'use client'

import { useEffect, useState, useTransition } from 'react'
import { Clock } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  getWorkflowScheduleAction,
  removeWorkflowScheduleAction,
  setWorkflowScheduleAction,
} from '@/features/workflows/actions'
import {
  describeCron,
  schedulePresets,
} from '@/features/workflows/lib/schedule-presets'

function detectTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

interface ScheduleState {
  cron: string | null
  timezone: string | null
}

export function ScheduleDialog({
  workflowId,
  open,
  onOpenChange,
}: {
  workflowId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [schedule, setSchedule] = useState<ScheduleState | null>(null)
  const [selectedCron, setSelectedCron] = useState<string>(
    schedulePresets[0].cron
  )
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    getWorkflowScheduleAction(workflowId).then((result) => {
      setSchedule(result)
      if (result.cron) setSelectedCron(result.cron)
    })
  }, [open, workflowId])

  const isScheduled = Boolean(schedule?.cron)

  const handleSave = () => {
    startTransition(async () => {
      try {
        await setWorkflowScheduleAction({
          id: workflowId,
          cron: selectedCron,
          timezone: detectTimezone(),
        })
        toast.success(`Scheduled: ${describeCron(selectedCron)}`)
        onOpenChange(false)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Could not set the schedule.'
        )
      }
    })
  }

  const handleRemove = () => {
    startTransition(async () => {
      try {
        await removeWorkflowScheduleAction(workflowId)
        toast.success('Schedule removed')
        onOpenChange(false)
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Could not remove the schedule.'
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-4" />
            Schedule
          </DialogTitle>
          <DialogDescription>
            Run this workflow automatically, on top of the Run button.
          </DialogDescription>
        </DialogHeader>

        {isScheduled && schedule && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Currently runs <strong>{describeCron(schedule.cron!)}</strong>
            {schedule.timezone && ` (${schedule.timezone})`}.
          </p>
        )}

        <Select value={selectedCron} onValueChange={setSelectedCron}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {schedulePresets.map((preset) => (
              <SelectItem key={preset.cron} value={preset.cron}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Runs in your local timezone ({detectTimezone()}).
        </p>

        <DialogFooter className="gap-2 sm:justify-between">
          {isScheduled ? (
            <Button variant="ghost" disabled={isPending} onClick={handleRemove}>
              Remove schedule
            </Button>
          ) : (
            <span />
          )}
          <Button disabled={isPending} onClick={handleSave}>
            {isScheduled ? 'Update schedule' : 'Set schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
