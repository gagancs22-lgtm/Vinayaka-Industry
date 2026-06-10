// app/(dashboard)/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, Tags, Warehouse, ShoppingCart,
  Truck, Receipt, RotateCcw, DollarSign, BarChart2,
  FileText, Users, ClipboardList, Settings, Bell,
  ChevronLeft, Menu, LogOut, Moon, Sun, Package2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  badge?: number;
}

const NAV: NavItem[] = [
  { href: "/",           label: "Dashboard",   icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: "/billing",    label: "Billing",      icon: <Receipt className="w-4 h-4" /> },
  { href: "/products",   label: "Products",     icon: <Package className="w-4 h-4" /> },
  { href: "/categories", label: "Categories",   icon: <Tags className="w-4 h-4" /> },
  { href: "/inventory",  label: "Inventory",    icon: <Warehouse className="w-4 h-4" /> },
  { href: "/purchases",  label: "Purchases",    icon: <ShoppingCart className="w-4 h-4" /> },
  { href: "/suppliers",  label: "Suppliers",    icon: <Truck className="w-4 h-4" /> },
  { href: "/returns",    label: "Returns",      icon: <RotateCcw className="w-4 h-4" /> },
  { href: "/expenses",   label: "Expenses",     icon: <DollarSign className="w-4 h-4" /> },
  { href: "/analytics",  label: "Analytics",    icon: <BarChart2 className="w-4 h-4" /> },
  { href: "/reports",    label: "Reports",      icon: <FileText className="w-4 h-4" /> },
  { href: "/users",      label: "Users",        icon: <Users className="w-4 h-4" />, adminOnly: true },
  { href: "/audit-logs", label: "Audit Logs",   icon: <ClipboardList className="w-4 h-4" />, adminOnly: true },
  { href: "/settings",   label: "Settings",     icon: <Settings className="w-4 h-4" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [userRole, setUserRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [userName, setUserName] = useState("");
  const [notifications, setNotifications] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Get user info from session
    fetch("/api/auth/me").then(r => r.json()).then(data => {
      if (data.user) {
        setUserRole(data.user.role);
        setUserName(data.user.name);
      }
    }).catch(() => {});

    // Get unread notification count
    fetch("/api/notifications?unread=true").then(r => r.json()).then(data => {
      setNotifications(data.data?.length || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  const visibleNav = NAV.filter(item => !item.adminOnly || userRole === "ADMIN");

  const Sidebar = () => (
    <div className={`
      flex flex-col h-full bg-[#0f172a] border-r border-slate-800
      transition-all duration-300 ease-in-out
      ${collapsed ? "w-16" : "w-60 sm:w-72"}
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Package2 className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-sm truncate">InventoryPro</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-500 hover:text-slate-300 flex-shrink-0"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {visibleNav.map(item => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                ${active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
                }
                ${collapsed ? "justify-center" : ""}
              `}>
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {!collapsed && item.badge ? (
                  <Badge className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0">
                    {item.badge}
                  </Badge>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-800 p-3">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-800 mb-2">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {userName.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{userName}</p>
              <p className="text-slate-400 text-xs">{userRole}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 text-sm transition-colors ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 sm:h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-3 sm:px-4 gap-2 sm:gap-3 flex-shrink-0 shadow-sm">
          <button
            className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <Bell className="w-4 h-4" />
            {notifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto overscroll-contain">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
