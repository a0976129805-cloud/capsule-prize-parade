export type OrderMove = 'top' | 'up' | 'down';

export function moveMachine(ids: readonly string[], id: string, move: OrderMove): string[] {
  const next = [...ids];
  const from = next.indexOf(id);
  if (from < 0) return next;
  const to = move === 'top' ? 0 : move === 'up' ? from - 1 : from + 1;
  if (to < 0 || to >= next.length || from === to) return next;
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
}

export function validateMachineOrder(input: { ids: string[]; expected: string[] }) {
  for (const ids of [input.ids, input.expected]) {
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string' || !id || id.length > 200) || new Set(ids).size !== ids.length) {
      throw new Error('排列資料無效');
    }
  }
  if (input.ids.length !== input.expected.length || input.ids.some((id) => !input.expected.includes(id))) throw new Error('排列資料無效');
  return { ids: [...input.ids], expected: [...input.expected] };
}