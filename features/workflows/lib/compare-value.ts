export type ChangeResult =
  | { kind: 'first-observation' }
  | { kind: 'unchanged' }
  | { kind: 'changed'; previousValue: string }

export function compareValue({
  previousValue,
  newValue,
}: {
  previousValue: string | null
  newValue: string
}): ChangeResult {
  if (previousValue === null) return { kind: 'first-observation' }
  if (previousValue === newValue) return { kind: 'unchanged' }
  return { kind: 'changed', previousValue }
}
