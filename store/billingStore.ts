// store/billingStore.ts
import { create } from "zustand";
import type { CartItem } from "@/types";

interface BillingState {
  cart: CartItem[];
  discount: number;
  discountType: "FLAT" | "PERCENT";
  paymentMethod: "CASH" | "CARD" | "UPI" | "CREDIT";
  customerName: string;
  customerPhone: string;
  amountPaid: number;

  // Actions
  addToCart: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  updateItemDiscount: (variantId: string, discount: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  setDiscount: (discount: number) => void;
  setDiscountType: (type: "FLAT" | "PERCENT") => void;
  setPaymentMethod: (method: "CASH" | "CARD" | "UPI" | "CREDIT") => void;
  setCustomer: (name: string, phone: string) => void;
  setAmountPaid: (amount: number) => void;

  // Computed
  getSubtotal: () => number;
  getDiscountAmount: (taxPercent: number) => number;
  getTax: (taxPercent: number) => number;
  getTotal: (taxPercent: number) => number;
  getChange: (taxPercent: number) => number;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  cart: [],
  discount: 0,
  discountType: "FLAT",
  paymentMethod: "CASH",
  customerName: "",
  customerPhone: "",
  amountPaid: 0,

  addToCart: (item) => {
    set((state) => {
      const existing = state.cart.find((c) => c.variantId === item.variantId);
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.variantId === item.variantId
              ? { ...c, quantity: c.quantity + item.quantity }
              : c
          ),
        };
      }
      return { cart: [...state.cart, item] };
    });
  },

  updateQuantity: (variantId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(variantId);
      return;
    }
    set((state) => ({
      cart: state.cart.map((c) =>
        c.variantId === variantId ? { ...c, quantity } : c
      ),
    }));
  },

  updateItemDiscount: (variantId, discount) => {
    set((state) => ({
      cart: state.cart.map((c) =>
        c.variantId === variantId ? { ...c, discount } : c
      ),
    }));
  },

  removeFromCart: (variantId) => {
    set((state) => ({
      cart: state.cart.filter((c) => c.variantId !== variantId),
    }));
  },

  clearCart: () => {
    set({
      cart: [],
      discount: 0,
      customerName: "",
      customerPhone: "",
      amountPaid: 0,
    });
  },

  setDiscount: (discount) => set({ discount }),
  setDiscountType: (discountType) => set({ discountType }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCustomer: (customerName, customerPhone) =>
    set({ customerName, customerPhone }),
  setAmountPaid: (amountPaid) => set({ amountPaid }),

  getSubtotal: () => {
    const { cart } = get();
    return cart.reduce(
      (sum, item) =>
        sum + item.quantity * item.sellingPrice - (item.discount || 0),
      0
    );
  },

  getDiscountAmount: () => {
    const { discount, discountType } = get();
    const subtotal = get().getSubtotal();
    if (discountType === "PERCENT") return (subtotal * discount) / 100;
    return discount;
  },

  getTax: (taxPercent: number) => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount(taxPercent);
    return ((subtotal - discountAmount) * taxPercent) / 100;
  },

  getTotal: (taxPercent: number) => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount(taxPercent);
    const tax = get().getTax(taxPercent);
    return subtotal - discountAmount + tax;
  },

  getChange: (taxPercent: number) => {
    const { amountPaid } = get();
    const total = get().getTotal(taxPercent);
    return Math.max(0, amountPaid - total);
  },
}));
