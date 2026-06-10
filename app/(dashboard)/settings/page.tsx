"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Settings {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  currency: string;
  taxRate: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        setSettings(data.data || {
          businessName: "",
          businessEmail: "",
          businessPhone: "",
          gstin: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          currency: "INR",
          taxRate: 18,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof Settings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [field]: value });
      setSaved(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-6">
        <div className="h-12 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure your business information</p>
      </motion.div>

      {/* Success Message */}
      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-center gap-3"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">✓</div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Settings saved successfully</p>
        </motion.div>
      )}

      {/* Business Information */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4"
      >
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Business Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Business Name</label>
            <Input
              value={settings.businessName}
              onChange={e => handleChange("businessName", e.target.value)}
              placeholder="Your business name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Business Email</label>
            <Input
              type="email"
              value={settings.businessEmail}
              onChange={e => handleChange("businessEmail", e.target.value)}
              placeholder="business@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone</label>
            <Input
              value={settings.businessPhone}
              onChange={e => handleChange("businessPhone", e.target.value)}
              placeholder="+91 9876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">GSTIN</label>
            <Input
              value={settings.gstin}
              onChange={e => handleChange("gstin", e.target.value)}
              placeholder="27AABCT1234H1Z0"
            />
          </div>
        </div>
      </motion.div>

      {/* Address */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4"
      >
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Address</h2>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address</label>
          <Input
            value={settings.address}
            onChange={e => handleChange("address", e.target.value)}
            placeholder="Street address"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">City</label>
            <Input
              value={settings.city}
              onChange={e => handleChange("city", e.target.value)}
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">State</label>
            <Input
              value={settings.state}
              onChange={e => handleChange("state", e.target.value)}
              placeholder="State"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pincode</label>
            <Input
              value={settings.pincode}
              onChange={e => handleChange("pincode", e.target.value)}
              placeholder="600001"
            />
          </div>
        </div>
      </motion.div>

      {/* Tax & Currency */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 space-y-4"
      >
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Tax & Currency</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Currency</label>
            <select
              value={settings.currency}
              onChange={e => handleChange("currency", e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            >
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tax Rate (%)</label>
            <Input
              type="number"
              value={settings.taxRate}
              onChange={e => handleChange("taxRate", parseFloat(e.target.value))}
              placeholder="18"
            />
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3"
      >
        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </motion.div>
    </div>
  );
}
