"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Report {
  id: string;
  name: string;
  type: string;
  generatedDate: string;
  size: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then(r => r.json())
      .then(data => {
        setReports(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const reportTypes = [
    { id: "sales", label: "Sales Report", description: "Detailed sales analysis" },
    { id: "inventory", label: "Inventory Report", description: "Stock levels and movements" },
    { id: "purchase", label: "Purchase Report", description: "Supplier and purchase details" },
    { id: "expense", label: "Expense Report", description: "Business expenses breakdown" },
  ];

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
      >
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Generate and download business reports</p>
      </motion.div>

      {/* Report Types Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {reportTypes.map((type, i) => (
          <div
            key={type.id}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">{type.label}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{type.description}</p>
              </div>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Download className="w-4 h-4" />
              Generate Report
            </Button>
          </div>
        ))}
      </motion.div>

      {/* Recent Reports */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
      >
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Reports</h2>
        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{report.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(report.generatedDate).toLocaleDateString()} • {report.size}</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">No reports generated yet</p>
        )}
      </motion.div>
    </div>
  );
}
