/**
 * Merges two arrays while avoiding duplicates based on a predicate function.
 *
 * @template T - Type of the first array
 * @template U - Type of the second array
 * @param {T} a - First array
 * @param {U} b - Second array to merge into the first
 * @param {function(T[number], U[number]): boolean} predicate - Function to determine if two items are equal
 *                                                            - Defaults to strict equality (===)
 * @returns {Array<T[number] | U[number]>} A new array containing all items from the first array
 *                                         and non-duplicate items from the second array
 *
 * @example
 * // Basic usage with default predicate
 * merge([1, 2, 3], [2, 3, 4]) // returns [1, 2, 3, 4]
 *
 * @example
 * // With custom predicate for object arrays
 * merge(
 *   [{id: 1}, {id: 2}],
 *   [{id: 2}, {id: 3}],
 *   (a, b) => a.id === b.id
 * ) // returns [{id: 1}, {id: 2}, {id: 3}]
 */
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

/**
 * Randomly shuffles an array and optionally limits the result size.
 *
 * @template T - Type of the array
 * @param {T} array - The array to shuffle
 * @param {number} [limit] - Optional maximum length of the returned array
 *                         - If not provided, the entire array will be shuffled
 * @returns {Array<T[number]>} A new array containing shuffled elements
 *
 * @example
 * // Shuffle entire array
 * shuffle([1, 2, 3, 4, 5]) // returns randomly ordered array like [3, 1, 5, 2, 4]
 *
 * @example
 * // Shuffle and limit result (like random sampling without replacement)
 * shuffle([1, 2, 3, 4, 5], 2) // returns 2 random elements like [4, 1]
 */
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
