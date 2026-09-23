import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

import {
  nodeRegistry,
  type StepNodeType,
} from '@/features/workflows/nodes/node-registry'
import { useLatestRunSteps } from '@/features/workflows/components/workflow-runs-provider'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

function StepNodeComponent({ id, data, selected }: NodeProps<StepNodeType>) {
  const { type, kind, title, values } = data
  const def = nodeRegistry[type]
  const Icon = def.icon
  const fields = def.fields.filter((field) => values[field.key])

  const { steps, isLive } = useLatestRunSteps()
  const status = steps.find((step) => step.nodeId === id)?.status
  const isRunning = status === 'running' && isLive
  const isFailed = status === 'failed'

  const hasTarget = kind !== 'trigger'

  return (
    <div
      className={cn(
        'max-w-80 min-w-50 overflow-hidden rounded-(--radius) border border-border bg-card text-card-foreground shadow-md transition-shadow duration-200',
        isRunning &&
          'border-blue-500/60 shadow-[0_0_0_3px_rgba(59,130,246,0.25),0_8px_24px_-8px_rgba(59,130,246,0.5)]',
        isFailed &&
          'border-destructive/60 shadow-[0_0_0_3px_rgba(239,68,68,0.2),0_8px_24px_-8px_rgba(239,68,68,0.4)]',
        selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
      )}
    >
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ transform: 'translate(-100%, -50%)' }}
          className="h-3.5! w-1.5! min-w-0! rounded-l-xs! rounded-r-none! border-0! bg-border!"
        />
      )}

      <div className={cn('h-1 w-full', def.accent.split(' ')[0])} />

      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-md shadow-sm ring-1 ring-black/10',
            def.accent
          )}
        >
          {isRunning ? (
            <Spinner className="size-4" />
          ) : (
            <Icon className="size-4" />
          )}
        </div>
        <span className="truncate text-sm font-semibold">{title}</span>
      </div>

      {fields.length > 0 && (
        <>
          <div className="border-t border-border" />
          <div className="flex flex-col gap-1.5 px-3 py-2.5">
            {fields.map((field) => {
              const fieldValue = values[field.key]
              const isTemplate = fieldValue.includes('{{')
              return (
                <div
                  key={field.key}
                  className="flex items-center justify-between gap-4 text-xs"
                >
                  <span className="shrink-0 text-muted-foreground">
                    {field.label}
                  </span>
                  <span
                    className={cn(
                      'truncate font-medium',
                      isTemplate && 'font-mono text-[11px] text-primary'
                    )}
                  >
                    {fieldValue}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ transform: 'translate(100%, -50%)' }}
        className="h-3.5! w-1.5! min-w-0! rounded-l-none! rounded-r-xs! border-0! bg-border!"
      />
    </div>
  )
}

export const StepNode = memo(StepNodeComponent)
