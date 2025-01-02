export function shuffle<T extends Array<unknown> | ReadonlyArray<unknown>>(
  array: T,
  limit?: number,
): ShuffleReturn<T> {
  const arrayLength = array.length
  const shuffleCount = Math.min(limit ?? arrayLength, arrayLength)

  const indices = Array.from({ length: arrayLength }, (_, i) => i)

  for (let i = 0; i < shuffleCount; i++) {
    const remainingLength = arrayLength - i
    const randomIndex = i + Math.floor(Math.random() * remainingLength);

    [indices[i], indices[randomIndex]] = [indices[randomIndex]!, indices[i]!]
  }

  const result = indices
    .slice(0, shuffleCount)
    .map(index => array[index]) as ShuffleReturn<T>

  return result
}

export type ShuffleReturn<T extends Array<unknown> | ReadonlyArray<unknown>> =
  T extends ReadonlyArray<infer U>
    ? U[]
    : T
