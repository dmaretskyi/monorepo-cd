export function max(arr: number[]): number {
  let max = arr[0]
  for(const val of arr) {
    if(val > max) {
      max = val
    }
  }
  return max
}
