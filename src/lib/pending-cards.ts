export function pendingCardCounts(numbers: number[]) {
  const counts = new Map<number, number>();
  for (const no of numbers) counts.set(no, (counts.get(no) ?? 0) + 1);
  return counts;
}