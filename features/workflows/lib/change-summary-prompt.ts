export function buildChangeSummaryPrompt({
  previousValue,
  newValue,
}: {
  previousValue: string | null
  newValue: string
}): string {
  if (previousValue === null) {
    return `You are watching a value on a web page for changes. This is the first time it has been observed, so there is nothing to compare yet. In one short sentence, state the observed value as a baseline. Value: "${newValue}"`
  }

  return `You are watching a value on a web page for changes. Summarize what changed in one short, plain-English sentence (e.g. "Price dropped from $49 to $39"). Previous value: "${previousValue}". New value: "${newValue}"`
}
