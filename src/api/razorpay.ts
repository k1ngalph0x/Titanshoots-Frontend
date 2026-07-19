import type { Checkout } from "./client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function openRazorpay(
  checkout: Checkout,
  customerName: string,
  onDismiss: () => void,
): void {
  const rzp = new window.Razorpay({
    key: checkout.razorpay_key_id,
    order_id: checkout.razorpay_order_id,
    amount: checkout.amount_paise,
    currency: checkout.currency,
    name: "TitanShoots",
    description: "Session booking",
    prefill: { name: customerName },
    theme: { color: "#f0164a" },
    modal: { ondismiss: onDismiss },
    // no handler needed — the webhook confirms; we poll for it
  });
  rzp.open();
}
