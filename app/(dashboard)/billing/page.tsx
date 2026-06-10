// app/(dashboard)/billing/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Minus, Trash2, Receipt, User, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useBillingStore } from "@/store/billingStore";
import { toast } from "@/components/ui/use-toast";

interface Variant {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stock: number;
  unit: string;
}
interface ProductResult {
  id: string;
  name: string;
  image?: string;
  sellMethod: string;
  variants: Variant[];
}

const PAYMENT_METHODS = ["CASH", "CARD", "UPI", "CREDIT"] as const;

export default function BillingPage() {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [taxPercent, setTaxPercent] = useState(18);
  const [showCustomer, setShowCustomer] = useState(false);

  const {
    cart, addToCart, updateQuantity, removeFromCart, clearCart,
    discount, discountType, setDiscount, setDiscountType,
    paymentMethod, setPaymentMethod,
    customerName, customerPhone, setCustomer,
    amountPaid, setAmountPaid,
    getSubtotal, getDiscountAmount, getTax, getTotal, getChange,
  } = useBillingStore();

  // Fetch settings for tax percent
  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(res => { if (res.data?.taxPercent) setTaxPercent(res.data.taxPercent); });
  }, []);

  // Product search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=12`);
      const data = await res.json();
      setResults(data.data || []);
      setSearching(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const addVariantToCart = (product: ProductResult, variant: Variant) => {
    if (variant.stock <= 0) {
      toast({ title: "Out of stock", variant: "destructive" });
      return;
    }
    addToCart({
      variantId: variant.id,
      productName: product.name,
      variantName: variant.name,
      quantity: 1,
      unit: variant.unit || "Pcs",
      sellMethod: product.sellMethod as "BY_QUANTITY" | "BY_WEIGHT",
      sellingPrice: variant.sellingPrice,
      stock: variant.stock,
    });
    setQuery("");
    setResults([]);
    searchRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          items: cart.map(item => ({
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unit: item.unit,
            sellingPrice: item.sellingPrice,
            discount: item.discount || 0,
          })),
          discount: getDiscountAmount(taxPercent),
          discountType,
          taxPercent,
          paymentMethod,
          amountPaid: amountPaid || getTotal(taxPercent),
          notes: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      clearCart();
      toast({ title: `Bill ${data.data.invoiceNumber} created!` });
      router.push(`/billing/${data.data.id}`);
    } catch (err: unknown) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = getSubtotal();
  const discountAmt = getDiscountAmount(taxPercent);
  const tax = getTax(taxPercent);
  const total = getTotal(taxPercent);
  const change = getChange(taxPercent);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 overflow-hidden">

      {/* ── LEFT: Product Search ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              ref={searchRef}
              className="pl-10 h-11 text-base"
              placeholder="Search product, SKU, or scan barcode…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {searching && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          )}
          {!searching && results.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {results.map(product =>
                product.variants.map(variant => (
                  <motion.button
                    key={variant.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addVariantToCart(product, variant)}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                               p-3 text-left shadow-sm hover:shadow-md hover:border-blue-300
                               transition-all duration-150 disabled:opacity-50"
                    disabled={variant.stock <= 0}
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-20 object-cover rounded-lg mb-2"
                      />
                    )}
                    <p className="font-semibold text-slate-800 dark:text-white text-sm line-clamp-1">
                      {product.name}
                    </p>
                    <p className="text-slate-400 text-xs mb-1">{variant.name} · {variant.sku}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-blue-600 font-bold text-sm">
                        ₹{variant.sellingPrice.toLocaleString("en-IN")}
                      </span>
                      <Badge
                        className={`text-xs px-1.5 ${
                          variant.stock <= 0
                            ? "bg-red-100 text-red-600"
                            : variant.stock <= 10
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {variant.stock <= 0 ? "Out" : `${variant.stock} left`}
                      </Badge>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          )}
          {!searching && query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Search className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No products found for "{query}"</p>
            </div>
          )}
          {!query && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Search className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-lg font-medium">Search to add products</p>
              <p className="text-sm">Type a name, SKU, or scan a barcode</p>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart ────────────────────────────────────────────────── */}
      <div className="w-96 flex flex-col bg-white dark:bg-slate-800 shadow-xl">

        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800 dark:text-white">Cart</h2>
            {cart.length > 0 && (
              <Badge className="bg-blue-100 text-blue-700 text-xs">{cart.length}</Badge>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700">
              Clear all
            </button>
          )}
        </div>

        {/* Customer (collapsible) */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <button
            className="w-full px-5 py-3 flex items-center justify-between text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
            onClick={() => setShowCustomer(!showCustomer)}
          >
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <User className="w-4 h-4" />
              <span>{customerName || "Walk-in Customer"}</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${showCustomer ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {showCustomer && (
              <motion.div
                initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-3 grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Customer name"
                    value={customerName}
                    onChange={e => setCustomer(e.target.value, customerPhone)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={e => setCustomer(customerName, e.target.value)}
                    className="text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 py-10">
                <Receipt className="w-12 h-12 mb-3 opacity-40" />
                <p className="font-medium">No items in cart</p>
              </div>
            ) : (
              cart.map(item => (
                <motion.div
                  key={item.variantId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="px-5 py-3 border-b border-slate-100 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                        {item.productName}
                      </p>
                      <p className="text-slate-400 text-xs">{item.variantName}</p>
                      <p className="text-blue-600 text-xs font-medium mt-0.5">
                        ₹{item.sellingPrice.toLocaleString("en-IN")} / {item.unit}
                      </p>
                    </div>
                    <button onClick={() => removeFromCart(item.variantId)}>
                      <Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - (item.sellMethod === "BY_WEIGHT" ? 0.5 : 1))}
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-14 text-center text-sm font-bold text-slate-800 dark:text-white">
                        {item.quantity} {item.unit}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + (item.sellMethod === "BY_WEIGHT" ? 0.5 : 1))}
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white text-sm">
                      ₹{(item.quantity * item.sellingPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Discount + Tax */}
        {cart.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-5 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={discountType}
                onChange={e => setDiscountType(e.target.value as "FLAT" | "PERCENT")}
                className="text-xs border rounded px-2 py-1 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                <option value="FLAT">₹ Flat</option>
                <option value="PERCENT">% Off</option>
              </select>
              <Input
                type="number"
                min={0}
                placeholder="Discount"
                value={discount || ""}
                onChange={e => setDiscount(Number(e.target.value))}
                className="h-8 text-sm flex-1"
              />
            </div>

            {/* Payment method */}
            <div className="flex gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                    paymentMethod === m
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            {paymentMethod === "CASH" && (
              <Input
                type="number"
                placeholder="Amount tendered"
                value={amountPaid || ""}
                onChange={e => setAmountPaid(Number(e.target.value))}
                className="h-8 text-sm"
              />
            )}
          </div>
        )}

        {/* Totals */}
        {cart.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-5 py-3 bg-slate-50 dark:bg-slate-900 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Discount</span>
                <span>−₹{discountAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>GST ({taxPercent}%)</span>
                <span>₹{tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-slate-800 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Total</span>
              <span>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            {change > 0 && (
              <div className="flex justify-between text-sm font-medium text-emerald-600">
                <span>Change</span>
                <span>₹{change.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        )}

        {/* Checkout Button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700"
            disabled={cart.length === 0 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing…
              </div>
            ) : (
              <>
                <Receipt className="w-5 h-5 mr-2" />
                Generate Bill · ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
