// lib/invoice.ts
import { db } from "@/lib/db"
import { bill } from "@/lib/db/schema"
import { like, desc } from "drizzle-orm"

/**
 * Generates a unique invoice number in format: INV-YYYY-NNNNNN
 * Example: INV-2026-000001
 */
export async function generateInvoiceNumber(): Promise<string> {
  try {
    const currentYear = new Date().getFullYear()
    const prefix = `INV-${currentYear}`

    // Get the last invoice for this year
    const bills = await db
      .select()
      .from(bill)
      .orderBy(desc(bill.createdAt))
      .limit(1)

    let nextNumber = 1

    if (bills.length > 0 && bills[0].invoiceNumber.startsWith(prefix)) {
      // Extract the numeric part from the last invoice number
      const lastNumber = parseInt(bills[0].invoiceNumber.split("-")[2], 10)
      nextNumber = lastNumber + 1
    }

    // Format with leading zeros (6 digits)
    const formattedNumber = String(nextNumber).padStart(6, "0")
    return `${prefix}-${formattedNumber}`
  } catch (error) {
    // Fallback if database is unavailable
    return `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, "0")}`
  }
}

/**
 * Validates an invoice number format
 */
export function validateInvoiceNumber(invoiceNumber: string): boolean {
  const pattern = /^INV-\d{4}-\d{6}$/;
  return pattern.test(invoiceNumber);
}

/**
 * Parses invoice number to extract components
 */
export function parseInvoiceNumber(invoiceNumber: string): {
  prefix: string;
  year: number;
  number: number;
} | null {
  const match = invoiceNumber.match(/^(INV)-(\d{4})-(\d{6})$/);
  if (!match) return null;

  return {
    prefix: match[1],
    year: parseInt(match[2], 10),
    number: parseInt(match[3], 10),
  };
}
