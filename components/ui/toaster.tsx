"use client";

import * as React from "react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]">
      {toasts
        .filter((t) => t.open !== false)
        .map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "group pointer-events-auto relative flex w-full items-start justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all",
              toast.variant === "destructive"
                ? "border-destructive bg-destructive text-destructive-foreground"
                : "border bg-background text-foreground"
            )}
          >
            <div className="grid gap-1">
              {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
              {toast.description && (
                <p className="text-sm opacity-90">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="absolute right-2 top-2 rounded-md p-1 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
    </div>
  );
}
