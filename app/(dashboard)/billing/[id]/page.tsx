// app/(dashboard)/billing/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download, Printer, Mail, ArrowLeft, Share2, CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface BillItem {
  productName: string;
  variantName: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  discount: number;
  tax: number;
  totalPrice: number;
}

interface Bill {
  id: string;
  invoiceNumber: string;
  billDate: string;
  customerName?: string;
  customerPhone?: string;
  status: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  tax: number;
  taxPercent: number;
  totalAmount: number;
  amountPaid: number;
  change: number;
  notes?: string;
  items: BillItem[];
  user: { name: string };
}

interface Settings {
  businessName: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  currencySymbol: string;
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
  UNPAID: "bg-amber-100 text-amber-700 border-amber-200",
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
  PROFORMA: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function InvoicePreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/billing/${id}`).then(r => r.json()),
      fetch("/api/settings").then(r => r.json()),
    ]).then(([billRes, settingsRes]) => {
      setBill(billRes.data);
      setSettings(settingsRes.data);
      setLoading(false);
    });
  }, [id]);

  const handleDownload = () => {
    window.open(`/api/billing/${id}/pdf`, "_blank");
  };

  const handlePrint = () => {
    window.open(`/api/billing/${id}/pdf`, "_blank");
  };

  const handleEmail = async () => {
    if (!bill?.customerPhone) return;
    setEmailLoading(true);
    try {
      await fetch(`/api/billing/${id}/email`, { method: "POST" });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!bill || !settings) {
    return <div className="p-8 text-center text-slate-500">Invoice not found.</div>;
  }

  const cur = settings.currencySymbol || "₹";

  function fmt(n: number) {
    return `${cur}${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Action Bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="font-bold text-slate-800 dark:text-white">{bill.invoiceNumber}</h1>
              <p className="text-xs text-slate-500">
                {new Date(bill.billDate).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </p>
            </div>
            <Badge className={`border text-xs ${STATUS_COLORS[bill.status] || ""}`}>
              {bill.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleEmail} disabled={emailLoading}>
              {emailSent
                ? <><CheckCircle className="w-4 h-4 mr-1 text-emerald-500" /> Sent</>
                : <><Mail className="w-4 h-4 mr-1" /> Email</>
              }
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Preview — matches PDF layout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto my-6 px-4"
      >
        <div className="bg-white shadow-xl rounded-sm border border-slate-200 overflow-hidden">

          {/* ── HEADER ────────────────────────────────────────────────────── */}
          <div className="bg-[#1a3a5c] px-8 py-6 flex justify-between items-start">
            <div>
              <h2 className="text-white text-2xl font-bold tracking-tight">
                {settings.businessName}
              </h2>
              {settings.address && (
                <p className="text-[#dce8f5] text-xs mt-1">{settings.address}</p>
              )}
              {settings.gstin && (
                <p className="text-[#adc8e8] text-xs mt-0.5">GSTIN: {settings.gstin}</p>
              )}
              {(settings.phone || settings.email) && (
                <p className="text-[#adc8e8] text-xs mt-0.5">
                  {[settings.phone, settings.email].filter(Boolean).join("   |   ")}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="bg-[#c0392b] text-white text-xs font-bold px-3 py-1 rounded mb-3">
                TAX INVOICE
              </div>
              <p className="text-white font-bold text-lg">{bill.invoiceNumber}</p>
              <p className="text-[#adc8e8] text-xs">
                {new Date(bill.billDate).toLocaleDateString("en-IN", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </p>
              <p className="text-[#adc8e8] text-xs mt-1">
                Payment: {bill.paymentMethod}
              </p>
            </div>
          </div>

          {/* ── BILL TO ───────────────────────────────────────────────────── */}
          <div>
            <div className="bg-[#2d5986] px-8 py-1.5 flex">
              <span className="text-white text-xs font-bold w-1/2">BILL TO</span>
              <span className="text-white text-xs font-bold w-1/2">SHIP TO</span>
            </div>
            <div className="grid grid-cols-2 border-b border-slate-200">
              <div className="px-8 py-4 border-r border-slate-200">
                <p className="font-bold text-slate-800">{bill.customerName || "Walk-in Customer"}</p>
                {bill.customerPhone && (
                  <p className="text-slate-500 text-sm">{bill.customerPhone}</p>
                )}
              </div>
              <div className="px-8 py-4">
                <p className="font-bold text-slate-800">{bill.customerName || "Walk-in Customer"}</p>
                {bill.customerPhone && (
                  <p className="text-slate-500 text-sm">{bill.customerPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── PRODUCT TABLE ─────────────────────────────────────────────── */}
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#2d5986] text-white">
                <th className="px-4 py-3 text-center w-10 font-semibold text-xs">Sl</th>
                <th className="px-4 py-3 text-left font-semibold text-xs">Product</th>
                <th className="px-4 py-3 text-center font-semibold text-xs">Qty</th>
                <th className="px-4 py-3 text-right font-semibold text-xs">Rate</th>
                <th className="px-4 py-3 text-center font-semibold text-xs">Tax%</th>
                <th className="px-4 py-3 text-right font-semibold text-xs">Tax Amt</th>
                <th className="px-4 py-3 text-right font-semibold text-xs">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 1 ? "bg-[#f0f4f8]" : "bg-white"}
                >
                  <td className="px-4 py-2.5 text-center text-slate-500 text-xs">{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-slate-800">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-slate-400 text-xs">{item.variantName}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center text-slate-600">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{fmt(item.sellingPrice)}</td>
                  <td className="px-4 py-2.5 text-center text-slate-600">
                    {bill.taxPercent}%
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{fmt(item.tax)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                    {fmt(item.totalPrice)}
                  </td>
                </tr>
              ))}
              {/* Empty rows */}
              {Array.from({ length: Math.max(0, 4 - bill.items.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className={
                  (bill.items.length + i) % 2 === 1 ? "bg-[#f0f4f8]" : "bg-white"
                }>
                  {Array.from({ length: 7 }).map((_, ci) => (
                    <td key={ci} className="px-4 py-2.5">&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── TOTALS ────────────────────────────────────────────────────── */}
          <div className="flex">
            {/* Notes */}
            <div className="flex-1 border-t border-r border-slate-200 px-6 py-4">
              {bill.notes && (
                <>
                  <p className="text-xs font-bold text-slate-400 mb-1">Notes / Remarks</p>
                  <p className="text-sm text-slate-600">{bill.notes}</p>
                </>
              )}
            </div>

            {/* Charge breakdown */}
            <div className="w-64 border-t border-slate-200">
              <div className="bg-[#2d5986] px-4 py-1.5 flex justify-between text-white text-xs font-bold">
                <span>Particulars</span>
                <span>Amount</span>
              </div>
              {[
                ["Sub Total", bill.subtotal],
                ...(bill.discount > 0 ? [["Discount (−)", -bill.discount]] : []),
                ...(bill.tax > 0 ? [[
                  bill.tax > 0 ? `GST @ ${bill.taxPercent}%` : "Tax",
                  bill.tax,
                ]] : []),
              ].map(([label, amount], i) => (
                <div
                  key={i}
                  className={`flex justify-between px-4 py-1.5 text-xs border-b border-slate-100
                    ${i % 2 === 1 ? "bg-[#f0f4f8]" : ""}`}
                >
                  <span className="text-slate-600">{String(label)}</span>
                  <span className="text-slate-800">{fmt(Number(amount))}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-[#1a3a5c] px-8 py-3 flex justify-between items-center">
            <span className="text-white font-bold text-base">GRAND TOTAL</span>
            <span className="text-white font-bold text-xl">{fmt(bill.totalAmount)}</span>
          </div>

          {/* Amount in words */}
          <div className="bg-[#fffbe6] px-8 py-2.5 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-400">Amount in Words: </span>
            <span className="text-xs font-semibold text-amber-800">
              {amountInWords(bill.totalAmount)}
            </span>
          </div>

          {/* ── FOOTER ────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 border-t border-slate-200">
            <div className="px-6 py-4 border-r border-slate-200 bg-slate-50">
              <p className="text-xs font-bold text-slate-400 mb-2">Declaration</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                We declare that this invoice shows the actual price of the goods described
                and that all particulars are true and correct.
              </p>
            </div>
            <div className="px-6 py-4 border-r border-slate-200 bg-slate-50">
              <p className="text-xs font-bold text-slate-400 mb-2">Terms & Conditions</p>
              <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
                <li>Goods once sold will not be taken back.</li>
                <li>Interest @ 18% p.a. on overdue payment.</li>
                <li>Subject to local jurisdiction.</li>
                <li>E & O.E.</li>
              </ol>
            </div>
            <div className="px-6 py-4 bg-[#eef2ff] text-center">
              <p className="text-xs font-bold text-slate-400 mb-3">
                For {settings.businessName}
              </p>
              <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center mb-3">
                <div className="text-center">
                  <p className="text-xs text-slate-300 font-bold leading-tight">COMPANY</p>
                  <p className="text-xs text-slate-300 font-bold leading-tight">SEAL</p>
                </div>
              </div>
              <div className="border-t border-slate-300 pt-1">
                <p className="text-xs text-slate-400">Authorised Signatory</p>
              </div>
            </div>
          </div>

          {/* Page footer */}
          <div className="px-8 py-2 bg-slate-50 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400">
              {settings.businessName}
              {settings.gstin ? `   |   GSTIN: ${settings.gstin}` : ""}
              {settings.phone ? `   |   ${settings.phone}` : ""}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Client-side amount-in-words (matches server-side logic)
function amountInWords(amount: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety"];

  function b1000(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + b1000(n % 100) : "");
  }

  const r = Math.floor(amount);
  const p = Math.round((amount - r) * 100);
  const parts: string[] = [];
  const cr = Math.floor(r / 10_000_000);
  const lk = Math.floor((r % 10_000_000) / 100_000);
  const th = Math.floor((r % 100_000) / 1_000);
  const re = r % 1_000;
  if (cr) parts.push(b1000(cr) + " Crore");
  if (lk) parts.push(b1000(lk)  + " Lakh");
  if (th) parts.push(b1000(th)  + " Thousand");
  if (re) parts.push(b1000(re));
  let result = "INR " + (parts.join(" ") || "Zero");
  if (p) result += ` and ${b1000(p)} Paise`;
  return result + " Only";
}
