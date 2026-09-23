import type { NodeType } from '@/features/workflows/nodes/node-registry'

export const premiumNodeTypes = new Set<NodeType>([
  'agent',
  'notify-on-change',
])
