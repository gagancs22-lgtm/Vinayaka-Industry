// app/(dashboard)/products/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus, Search, Filter, Download, Edit2, Trash2,
  Package, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";

interface Variant {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  purchasePrice: number;
  stock: number;
  minStock: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  image?: string;
  status: "ACTIVE" | "INACTIVE";
  unitType: string;
  sellMethod: string;
  category: { id: string; name: string; color?: string };
  variants: Variant[];
  createdAt: string;
}

interface Category { id: string; name: string; color?: string }

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "15",
      ...(search && { search }),
      ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
      ...(statusFilter !== "all" && { status: statusFilter }),
    });
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.data || []);
    setTotalPages(data.pagination?.pages || 1);
    setTotal(data.pagination?.total || 0);
    setLoading(false);
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.data || []));
  }, []);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, categoryFilter, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Product deleted" });
      fetchProducts();
    } catch {
      toast({ title: "Failed to delete product", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleExport = async () => {
    window.open("/api/reports/export?type=inventory&format=excel", "_blank");
  };

  const getStockStatus = (variants: Variant[]) => {
    const totalStock = variants.reduce((s, v) => s + v.stock, 0);
    const isLow = variants.some(v => v.stock > 0 && v.stock <= v.minStock);
    if (totalStock === 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-600" };
    if (isLow) return { label: "Low Stock", cls: "bg-amber-100 text-amber-700" };
    return { label: "In Stock", cls: "bg-emerald-100 text-emerald-700" };
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Products</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total} products total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1.5" /> Export
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push("/products/new")}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search by name, SKU, barcode…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Variants</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : products.map((product, idx) => {
                    const stockStatus = getStockStatus(product.variants);
                    const defaultVariant = product.variants.find(v => v.stock > 0) || product.variants[0];
                    return (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.image
                              ? <img src={product.image} alt={product.name}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                              : <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                  <Package className="w-4 h-4 text-slate-400" />
                                </div>
                            }
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-white text-sm">{product.name}</p>
                              <p className="text-xs text-slate-400">{product.unitType} · {product.sellMethod === "BY_WEIGHT" ? "By Weight" : "By Qty"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-mono">{product.sku}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                            {product.category.color && (
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: product.category.color }} />
                            )}
                            {product.category.name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stockStatus.cls}`}>
                              {stockStatus.label}
                            </span>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {product.variants.reduce((s, v) => s + v.stock, 0)} total
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {defaultVariant && (
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                ₹{defaultVariant.sellingPrice.toLocaleString("en-IN")}
                              </p>
                              <p className="text-xs text-slate-400">
                                Cost: ₹{defaultVariant.purchasePrice.toLocaleString("en-IN")}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`border text-xs ${STATUS_BADGE[product.status]}`}>
                            {product.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => router.push(`/products/${product.id}`)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/products/${product.id}?edit=true`)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(product.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
              }
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No products found</p>
                    <p className="text-slate-300 text-sm mt-1">Try adjusting your filters or add a new product</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the product and all its variants. Stock movements and bill history will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
