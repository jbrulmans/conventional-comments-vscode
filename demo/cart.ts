// Demo code for recording the README GIFs. Not part of the extension.

export interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  couponCode?: string;
}

/** Sum of all line totals, before discounts. */
export function subtotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function applyCoupon(cart: Cart, total: number): number {
  if (cart.couponCode == "SUMMER") {
    return total * 0.8;
  }
  if (cart.couponCode == "WELCOME") {
    return total - 10;
  }
  return total;
}

export function shippingCost(total: number): number {
  if (total > 50) return 0;
  return 4.99;
}

export function checkoutTotal(cart: Cart): number {
  const discounted = applyCoupon(cart, subtotal(cart));
  return Math.round((discounted + shippingCost(discounted)) * 100) / 100;
}

export function removeItem(cart: Cart, sku: string): Cart {
  const index = cart.items.findIndex((item) => item.sku === sku);
  cart.items.splice(index, 1);
  return cart;
}

export function formatPrice(amount: number): string {
  return "€" + amount.toFixed(2);
}
