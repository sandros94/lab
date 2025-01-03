export function merge<
  T extends Array<unknown> | ReadonlyArray<unknown>,
  U extends Array<unknown> | ReadonlyArray<unknown>,
>(
  a: T,
  b: U,
  predicate = (a: T[number], b: U[number]) => a === b,
): Array<T[number] | U[number]> {
  const _a = [...a]
  b.forEach((bItem: U[number]) => (
    _a.some((aItem: T[number]) => predicate(aItem, bItem))
      ? null
      : _a.push(bItem)
  ))
  return _a
}

export function shuffle<T extends Array<unknown> | ReadonlyArray<unknown>>(
  array: T,
  limit?: number,
): Array<T[number]> {
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
    .map(index => array[index])

  return result
}
