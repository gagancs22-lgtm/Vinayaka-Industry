// app/(dashboard)/inventory/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, TrendingDown, TrendingUp, AlertTriangle, XCircle, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface StockItem {
  id: string;
  name: string;           // variant name
  sku: string;
  productName: string;
  category: string;
  unitType: string;
  stock: number;
  minStock: number;
  purchasePrice: number;
  sellingPrice: number;
}

interface Movement {
  id: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  productName: string;
  variantName: string;
  notes?: string;
  referenceType?: string;
  createdAt: string;
  user: { name: string };
}

const TYPE_COLORS: Record<string, string> = {
  PURCHASE:      "bg-blue-100 text-blue-700",
  SALE:          "bg-emerald-100 text-emerald-700",
  DAMAGE:        "bg-red-100 text-red-700",
  RETURN_IN:     "bg-violet-100 text-violet-700",
  RETURN_OUT:    "bg-orange-100 text-orange-700",
  ADJUSTMENT:    "bg-amber-100 text-amber-700",
  INTERNAL_USAGE:"bg-slate-100 text-slate-700",
  EXPIRY:        "bg-rose-100 text-rose-700",
};

export default function InventoryPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movLoading, setMovLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100", ...(search && { search }) });
    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();
    setItems(data.data || []);
    setLoading(false);
  }, [search]);

  const fetchMovements = useCallback(async () => {
    setMovLoading(true);
    const res = await fetch("/api/inventory/movements?limit=50");
    const data = await res.json();
    setMovements(data.data || []);
    setMovLoading(false);
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);
  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const filtered = items.filter(item => {
    if (filter === "low") return item.stock > 0 && item.stock <= item.minStock;
    if (filter === "out") return item.stock === 0;
    return true;
  });

  const stats = {
    total:    items.length,
    inStock:  items.filter(i => i.stock > i.minStock).length,
    low:      items.filter(i => i.stock > 0 && i.stock <= i.minStock).length,
    out:      items.filter(i => i.stock === 0).length,
    value:    items.reduce((s, i) => s + i.stock * i.purchasePrice, 0),
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Inventory</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time stock levels and movement history</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Variants", value: stats.total, icon: <ArrowUpDown className="w-4 h-4" />, color: "bg-blue-500" },
          { label: "In Stock", value: stats.inStock, icon: <TrendingUp className="w-4 h-4" />, color: "bg-emerald-500" },
          { label: "Low Stock", value: stats.low, icon: <AlertTriangle className="w-4 h-4" />, color: "bg-amber-500" },
          { label: "Out of Stock", value: stats.out, icon: <XCircle className="w-4 h-4" />, color: "bg-red-500" },
          { label: "Inventory Value", value: `₹${(stats.value / 1000).toFixed(1)}K`, icon: <TrendingDown className="w-4 h-4" />, color: "bg-violet-500" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center text-white mb-2`}>
              {s.icon}
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="stock">
        <TabsList className="mb-4">
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="movements">Movement Log</TabsTrigger>
        </TabsList>

        {/* Stock Table */}
        <TabsContent value="stock">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search product or SKU…" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              {(["all", "low", "out"] as const).map(f => (
                <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
                  onClick={() => setFilter(f)}
                  className={filter === f ? "bg-blue-600" : ""}>
                  {f === "all" ? "All" : f === "low" ? "Low Stock" : "Out of Stock"}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Min</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Value</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {loading
                    ? Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                          </td>
                        ))}</tr>
                      ))
                    : filtered.map((item, idx) => {
                        const isOut = item.stock === 0;
                        const isLow = !isOut && item.stock <= item.minStock;
                        const pct = Math.min(100, (item.stock / Math.max(item.minStock * 3, 1)) * 100);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-800 dark:text-white text-sm">{item.productName}</p>
                              <p className="text-xs text-slate-400">{item.name}</p>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.sku}</td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.category}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-bold text-sm ${isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-800 dark:text-white"}`}>
                                  {item.stock}
                                </span>
                                <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${isOut ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-slate-500">{item.minStock}</td>
                            <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-300">
                              ₹{item.purchasePrice.toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-sm text-slate-800 dark:text-white">
                              ₹{(item.stock * item.purchasePrice).toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                isOut ? "bg-red-100 text-red-600" : isLow ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {isOut ? "Out" : isLow ? "Low" : "OK"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Movements */}
        <TabsContent value="movements">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Before</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">After</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {movLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                          </td>
                        ))}</tr>
                      ))
                    : movements.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                            {new Date(m.createdAt).toLocaleString("en-IN", {
                              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-sm text-slate-800 dark:text-white">{m.productName}</p>
                            <p className="text-xs text-slate-400">{m.variantName}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[m.type] || "bg-slate-100 text-slate-600"}`}>
                              {m.type.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold text-sm ${m.quantity > 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {m.quantity > 0 ? "+" : ""}{m.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-500">{m.previousStock}</td>
                          <td className="px-4 py-3 text-center font-semibold text-sm text-slate-800 dark:text-white">{m.newStock}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{m.user?.name}</td>
                          <td className="px-4 py-3 text-xs text-slate-400 max-w-xs truncate">{m.notes || "—"}</td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
