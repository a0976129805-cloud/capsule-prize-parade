export const PICKUP_DAYS = 7;
export function canSubmitCheckout(rulesAccepted: boolean, pickupAccepted: boolean): boolean {
  return rulesAccepted && pickupAccepted;
}