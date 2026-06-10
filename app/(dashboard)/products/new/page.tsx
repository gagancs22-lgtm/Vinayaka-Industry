// app/(dashboard)/products/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2, Upload, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Variant {
  name: string;
  sku: string;
  barcode: string;
  purchasePrice: number | "";
  sellingPrice: number | "";
  stock: number | "";
  minStock: number | "";
  isDefault: boolean;
}

const UNIT_TYPES = ["KG", "GRAM", "LITER", "MILLILITER", "PIECE", "PACKET", "BOTTLE", "BOX"];

const DEFAULT_VARIANT: Variant = {
  name: "",
  sku: "",
  barcode: "",
  purchasePrice: "",
  sellingPrice: "",
  stock: "",
  minStock: 10,
  isDefault: false,
};

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    description: "",
    categoryId: "",
    unitType: "PIECE",
    sellMethod: "BY_QUANTITY" as "BY_QUANTITY" | "BY_WEIGHT",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    minStock: 10,
    image: "",
  });

  const [variants, setVariants] = useState<Variant[]>([{ ...DEFAULT_VARIANT, isDefault: true }]);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.data || []));
  }, []);

  const updateVariant = (idx: number, field: keyof Variant, value: unknown) => {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const addVariant = () => {
    setVariants(prev => [...prev, { ...DEFAULT_VARIANT }]);
  };

  const removeVariant = (idx: number) => {
    if (variants.length === 1) {
      toast({ title: "At least one variant required", variant: "destructive" });
      return;
    }
    setVariants(prev => prev.filter((_, i) => i !== idx));
  };

  const setDefault = (idx: number) => {
    setVariants(prev => prev.map((v, i) => ({ ...v, isDefault: i === idx })));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "inventory_products");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      setForm(f => ({ ...f, image: data.secure_url }));
      setImagePreview(data.secure_url);
    } catch {
      // Fallback: local preview only
      const reader = new FileReader();
      reader.onload = e => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Product name required", variant: "destructive" }); return; }
    if (!form.sku.trim())  { toast({ title: "SKU required", variant: "destructive" }); return; }
    if (!form.categoryId)  { toast({ title: "Category required", variant: "destructive" }); return; }
    for (const v of variants) {
      if (!v.name.trim()) { toast({ title: "All variant names required", variant: "destructive" }); return; }
      if (!v.sku.trim())  { toast({ title: "All variant SKUs required", variant: "destructive" }); return; }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, variants }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast({ title: "Product created successfully!" });
      router.push("/products");
    } catch (err: unknown) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Add New Product</h1>
          <p className="text-slate-500 text-sm">Create a product with variants and pricing</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? "Saving…" : "Save Product"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Product Name *</Label>
                <Input
                  placeholder="e.g. Coca Cola, Basmati Rice"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>SKU *</Label>
                <Input
                  placeholder="e.g. COKE-001"
                  value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value.toUpperCase() }))}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Barcode</Label>
                <Input
                  placeholder="e.g. 8901234567890"
                  value={form.barcode}
                  onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                  className="font-mono"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description of the product"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Classification</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Unit Type</Label>
                <Select value={form.unitType} onValueChange={v => setForm(f => ({ ...f, unitType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIT_TYPES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sell Method</Label>
                <Select value={form.sellMethod} onValueChange={v => setForm(f => ({ ...f, sellMethod: v as "BY_QUANTITY" | "BY_WEIGHT" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BY_QUANTITY">By Quantity</SelectItem>
                    <SelectItem value="BY_WEIGHT">By Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Min Stock Alert</Label>
                <Input
                  type="number" min={0}
                  value={form.minStock}
                  onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={form.status === "ACTIVE"}
                  onCheckedChange={v => setForm(f => ({ ...f, status: v ? "ACTIVE" : "INACTIVE" }))}
                />
                <Label>{form.status}</Label>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-800 dark:text-white">Variants & Pricing</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  e.g. Coca Cola: 250ml, 500ml, 1L, 2L — each with separate SKU and price
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={addVariant}>
                <Plus className="w-4 h-4 mr-1" /> Add Variant
              </Button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    variant.isDefault
                      ? "border-blue-300 bg-blue-50/50 dark:bg-blue-900/10"
                      : "border-slate-200 dark:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">VARIANT {idx + 1}</span>
                      {variant.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!variant.isDefault && (
                        <button
                          onClick={() => setDefault(idx)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Set default
                        </button>
                      )}
                      <button onClick={() => removeVariant(idx)}>
                        <Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Variant Name *</Label>
                      <Input
                        placeholder="e.g. 500ml, 1KG"
                        value={variant.name}
                        onChange={e => updateVariant(idx, "name", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">SKU *</Label>
                      <Input
                        placeholder="e.g. COKE-500"
                        value={variant.sku}
                        onChange={e => updateVariant(idx, "sku", e.target.value.toUpperCase())}
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Purchase Price ₹</Label>
                      <Input
                        type="number" min={0} step={0.01}
                        placeholder="0.00"
                        value={variant.purchasePrice}
                        onChange={e => updateVariant(idx, "purchasePrice", e.target.value === "" ? "" : Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Selling Price ₹ *</Label>
                      <Input
                        type="number" min={0} step={0.01}
                        placeholder="0.00"
                        value={variant.sellingPrice}
                        onChange={e => updateVariant(idx, "sellingPrice", e.target.value === "" ? "" : Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Opening Stock</Label>
                      <Input
                        type="number" min={0}
                        placeholder="0"
                        value={variant.stock}
                        onChange={e => updateVariant(idx, "stock", e.target.value === "" ? "" : Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Min Stock Alert</Label>
                      <Input
                        type="number" min={0}
                        value={variant.minStock}
                        onChange={e => updateVariant(idx, "minStock", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Barcode</Label>
                      <Input
                        placeholder="Optional"
                        value={variant.barcode}
                        onChange={e => updateVariant(idx, "barcode", e.target.value)}
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Image */}
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Product Image</h2>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <div className={`
                w-full aspect-square rounded-xl border-2 border-dashed transition-colors
                flex flex-col items-center justify-center gap-3
                ${imagePreview ? "border-blue-200" : "border-slate-200 hover:border-blue-300"}
              `}>
                {uploadingImage ? (
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                ) : imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-300" />
                    <p className="text-sm text-slate-400 text-center">Click to upload<br />PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
            </label>
            {imagePreview && (
              <Button
                size="sm" variant="outline" className="w-full mt-2"
                onClick={() => { setImagePreview(null); setForm(f => ({ ...f, image: "" })); }}
              >
                Remove Image
              </Button>
            )}
          </div>

          {/* Margin preview */}
          {variants[0]?.purchasePrice && variants[0]?.sellingPrice && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5">
              <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm mb-3">Margin Preview</h3>
              {variants.map((v, i) => {
                if (!v.purchasePrice || !v.sellingPrice) return null;
                const margin = ((Number(v.sellingPrice) - Number(v.purchasePrice)) / Number(v.sellingPrice) * 100);
                return (
                  <div key={i} className="flex justify-between text-sm mb-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400">{v.name || `Variant ${i + 1}`}</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {margin.toFixed(1)}% margin
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
