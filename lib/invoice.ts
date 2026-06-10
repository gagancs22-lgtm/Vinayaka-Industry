// lib/invoice.ts
import { prisma } from "@/lib/db";

/**
 * Generates a unique invoice number in format: INV-YYYY-NNNNNN
 * Example: INV-2026-000001
 */
export async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}`;

  // Get the last invoice for this year
  const lastInvoice = await prisma.bill.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let nextNumber = 1;

  if (lastInvoice) {
    // Extract the numeric part from the last invoice number
    const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-")[2], 10);
    nextNumber = lastNumber + 1;
  }

  // Format with leading zeros (6 digits)
  const formattedNumber = String(nextNumber).padStart(6, "0");
  return `${prefix}-${formattedNumber}`;
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
