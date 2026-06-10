"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Purchase {
  id: string;
  supplierName: string;
  totalAmount: number;
  itemCount: number;
  purchaseDate: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/purchases")
      .then(r => r.json())
      .then(data => {
        setPurchases(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = purchases.filter(p =>
    p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-emerald-100 text-emerald-700";
      case "PENDING": return "bg-amber-100 text-amber-700";
      case "CANCELLED": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-12 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Purchases</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage supplier purchases</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" />
          New Purchase
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search purchases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Purchases Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Supplier</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Items</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Status</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((purchase) => (
              <tr key={purchase.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">{purchase.supplierName}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{purchase.itemCount}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">₹{purchase.totalAmount.toLocaleString("en-IN")}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                    {purchase.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-slate-500" />
                    </button>
                    <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">No purchases found</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
