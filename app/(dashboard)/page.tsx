// app/(dashboard)/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, ShoppingBag, Package, AlertTriangle,
  XCircle, IndianRupee, BarChart3, TrendingDown,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";

interface DashboardStats {
  todayRevenue: number;
  todayBillCount: number;
  monthRevenue: number;
  monthProfit: number;
  inventoryValue: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface TopProduct {
  productName: string;
  variantName: string;
  quantitySold: number;
  revenue: number;
}

const CARD_ICONS: Record<string, React.ReactNode> = {
  revenue:    <IndianRupee className="w-5 h-5" />,
  bills:      <ShoppingBag className="w-5 h-5" />,
  profit:     <TrendingUp className="w-5 h-5" />,
  inventory:  <Package className="w-5 h-5" />,
  lowStock:   <AlertTriangle className="w-5 h-5" />,
  outOfStock: <XCircle className="w-5 h-5" />,
};

const CARD_COLORS: Record<string, string> = {
  revenue:    "bg-blue-500",
  bills:      "bg-violet-500",
  profit:     "bg-emerald-500",
  inventory:  "bg-amber-500",
  lowStock:   "bg-orange-500",
  outOfStock: "bg-red-500",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<{ period: string; revenue: number }[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics?type=dashboard").then(r => r.json()),
      fetch("/api/analytics?type=sales-trend&period=monthly").then(r => r.json()),
      fetch("/api/analytics?type=top-products").then(r => r.json()),
    ]).then(([statsRes, trendRes, topRes]) => {
      setStats(statsRes.data);
      setTrend(trendRes.data || []);
      setTopProducts(topRes.data || []);
      setLoading(false);
    });
  }, []);

  function fmt(n: number) {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
    if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)}L`;
    if (n >= 1_000)      return `₹${(n / 1_000).toFixed(1)}K`;
    return `₹${n.toFixed(0)}`;
  }

  const summaryCards = stats ? [
    { key: "revenue",    label: "Today's Revenue",     value: fmt(stats.todayRevenue),    sub: `${stats.todayBillCount} bills today` },
    { key: "bills",      label: "Monthly Revenue",     value: fmt(stats.monthRevenue),    sub: "This month" },
    { key: "profit",     label: "Monthly Profit",      value: fmt(stats.monthProfit),     sub: "Revenue − Purchases − Expenses" },
    { key: "inventory",  label: "Inventory Value",     value: fmt(stats.inventoryValue),  sub: `${stats.totalProducts} active products` },
    { key: "lowStock",   label: "Low Stock",           value: String(stats.lowStockCount), sub: "Products below threshold" },
    { key: "outOfStock", label: "Out of Stock",        value: String(stats.outOfStockCount), sub: "Needs immediate restocking" },
  ] : [];

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <div className={`w-9 h-9 rounded-xl ${CARD_COLORS[card.key]} flex items-center justify-center text-white mb-3`}>
              {CARD_ICONS[card.key]}
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">
              {card.value}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">{card.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Revenue Trend</h3>
              <p className="text-xs text-slate-400">Last 12 months</p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(0)}L` : `${(v/1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Top Products</h3>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {topProducts.slice(0, 6).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {p.productName}
                  </p>
                  <p className="text-xs text-slate-400">{p.quantitySold} units sold</p>
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-white flex-shrink-0">
                  {fmt(p.revenue)}
                </span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-6">No sales data yet</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bar Chart — monthly revenue */}
      {trend.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700"
        >
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Monthly Sales Comparison</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(0)}L` : `${(v/1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
