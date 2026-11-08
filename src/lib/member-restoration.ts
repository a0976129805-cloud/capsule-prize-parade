/** Session events update presentation; only identity transitions refetch data. */
export function sessionEventAction(event: string) {
  return { restore: ['INITIAL_SESSION', 'TOKEN_REFRESHED', 'SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event), invalidate: ['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event) };
}