import { WorkflowShell } from '@/features/workflows/components/workflow-shell'
import { Room } from '@/features/workflows/components/room'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Room roomId={id}>
      <WorkflowShell workflowId={id} />
    </Room>
  )
}
