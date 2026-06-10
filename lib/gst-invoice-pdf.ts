// lib/gst-invoice-pdf.ts
// Professional A4 GST Invoice Generator using PDFKit
// Supports: Tax Invoice, Proforma Invoice, Purchase Invoice, Sales Invoice
// Handles: Intra-state (CGST+SGST) and Inter-state (IGST) automatically

import PDFDocument from "pdfkit";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface InvoiceCompany {
  name: string;
  tagline?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  gstin: string;
  pan: string;
  cin?: string;
  phone: string;
  email: string;
  website?: string;
  logoBase64?: string; // base64 PNG
}

export interface InvoiceParty {
  name: string;
  company?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  gstin?: string;
  phone?: string;
  email?: string;
}

export interface InvoiceItem {
  name: string;
  description?: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  discountPct?: number; // percentage
  taxPct: number;       // 5 | 12 | 18 | 28
}

export interface InvoiceCharges {
  freight?: number;
  loading?: number;
  packing?: number;
  other?: number;
  otherLabel?: string;
}

export interface InvoiceData {
  invoiceType: "TAX INVOICE" | "PROFORMA INVOICE" | "PURCHASE INVOICE" | "SALES INVOICE";
  number: string;
  date: string;
  dueDate?: string;
  poNumber?: string;
  deliveryNote?: string;
  referenceNo?: string;
  dispatchNo?: string;
  dispatchDate?: string;
  deliveryTerms?: string;
  transport?: {
    name?: string;
    vehicle?: string;
    lrNo?: string;
    destination?: string;
  };
  company: InvoiceCompany;
  billTo: InvoiceParty;
  shipTo?: InvoiceParty;
  items: InvoiceItem[];
  charges?: InvoiceCharges;
  notes?: string;
  terms?: string[];
  declaration?: string;
}

// ─── CALCULATED TYPES ─────────────────────────────────────────────────────────

interface CalcItem extends InvoiceItem {
  taxableAmt: number;
  taxAmt: number;
  totalAmt: number;
}

interface TaxBucket {
  taxable: number;
  tax: number;
  taxPct: number;
}

interface InvoiceCalc {
  items: CalcItem[];
  subtotal: number;
  totalDiscount: number;
  taxableAfterDiscount: number;
  freight: number;
  loading: number;
  packing: number;
  other: number;
  totalCharges: number;
  grandTaxable: number;
  isIGST: boolean;
  taxBuckets: Map<number, TaxBucket>; // keyed by HSN
  totalTax: number;
  grandTotal: number;
  amountInWords: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return `\u20B9${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function amountInWords(amount: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety"];

  function below1000(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + below1000(n % 100) : "");
  }

  const rupees = Math.floor(amount);
  const paise  = Math.round((amount - rupees) * 100);

  if (rupees === 0 && paise === 0) return "INR Zero Only";

  const crore = Math.floor(rupees / 10_000_000);
  const lakh  = Math.floor((rupees % 10_000_000) / 100_000);
  const thou  = Math.floor((rupees % 100_000) / 1_000);
  const rest  = rupees % 1_000;

  const parts: string[] = [];
  if (crore) parts.push(below1000(crore) + " Crore");
  if (lakh)  parts.push(below1000(lakh)  + " Lakh");
  if (thou)  parts.push(below1000(thou)  + " Thousand");
  if (rest)  parts.push(below1000(rest));

  let result = "INR " + parts.join(" ");
  if (paise) result += ` and ${below1000(paise)} Paise`;
  return result + " Only";
}

function calculate(data: InvoiceData): InvoiceCalc {
  const charges = data.charges || {};
  const freight  = charges.freight  || 0;
  const loading  = charges.loading  || 0;
  const packing  = charges.packing  || 0;
  const other    = charges.other    || 0;

  let subtotal = 0;
  let totalDiscount = 0;

  const calcItems: CalcItem[] = data.items.map(item => {
    const disc    = item.discountPct || 0;
    const gross   = item.qty * item.rate;
    const discAmt = gross * disc / 100;
    const taxable = gross - discAmt;
    const taxAmt  = taxable * item.taxPct / 100;
    const total   = taxable + taxAmt;
    subtotal      += gross;
    totalDiscount += discAmt;
    return { ...item, taxableAmt: taxable, taxAmt, totalAmt: total };
  });

  const taxableAfterDiscount = subtotal - totalDiscount;
  const totalCharges = freight + loading + packing + other;
  const grandTaxable = taxableAfterDiscount + totalCharges;

  const isIGST = data.company.stateCode !== data.billTo.stateCode;

  // Group by HSN for tax summary
  const taxBuckets = new Map<number, TaxBucket>();
  for (const item of calcItems) {
    const key = item.taxPct;
    const existing = taxBuckets.get(key) || { taxable: 0, tax: 0, taxPct: key };
    existing.taxable += item.taxableAmt;
    existing.tax     += item.taxAmt;
    taxBuckets.set(key, existing);
  }

  const totalTax   = Array.from(taxBuckets.values()).reduce((s, b) => s + b.tax, 0);
  const grandTotal = grandTaxable + totalTax;

  return {
    items: calcItems,
    subtotal,
    totalDiscount,
    taxableAfterDiscount,
    freight, loading, packing, other,
    totalCharges,
    grandTaxable,
    isIGST,
    taxBuckets,
    totalTax,
    grandTotal,
    amountInWords: amountInWords(grandTotal),
  };
}

// ─── PDF RENDERER ─────────────────────────────────────────────────────────────

const MM = 2.8346; // 1mm in points

// Colors
const NAVY   = "#1a3a5c";
const NAVY2  = "#2d5986";
const ALTROW = "#f0f4f8";
const TAXBG  = "#eaf1fb";
const BORDER = "#b0bec5";
const TEXT   = "#1a1a1a";
const MUTED  = "#607080";
const WORDBG = "#fffbe6";
const FOOTBG = "#f8fafc";
const SIGBG  = "#eef2ff";
const REDBADGE = "#c0392b";

function hex(color: string) {
  const r = parseInt(color.slice(1, 3), 16) / 255;
  const g = parseInt(color.slice(3, 5), 16) / 255;
  const b = parseInt(color.slice(5, 7), 16) / 255;
  return { r, g, b };
}

function setFill(doc: PDFKit.PDFDocument, color: string) {
  const { r, g, b } = hex(color);
  doc.fillColor([r, g, b]);
}

function setStroke(doc: PDFKit.PDFDocument, color: string) {
  const { r, g, b } = hex(color);
  doc.strokeColor([r, g, b]);
}

export function generateGSTInvoicePDF(data: InvoiceData): Buffer {
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    bufferPages: true,
    info: {
      Title: data.number,
      Author: data.company.name,
      Subject: data.invoiceType,
    },
  });

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const calc = calculate(data);

  const PAGE_W = doc.page.width;
  const PAGE_H = doc.page.height;
  const MAR = 15 * MM;           // 15mm margin
  const IW  = PAGE_W - 2 * MAR; // inner width

  let curY = MAR;

  // ── helper: draw rect with fill ──────────────────────────────────────────
  function fillRect(x: number, y: number, w: number, h: number, color: string) {
    setFill(doc, color);
    doc.rect(x, y, w, h).fill();
  }

  // ── helper: draw rect outline ────────────────────────────────────────────
  function strokeRect(x: number, y: number, w: number, h: number, lw = 0.5) {
    setStroke(doc, BORDER);
    doc.lineWidth(lw).rect(x, y, w, h).stroke();
  }

  // ── helper: text ─────────────────────────────────────────────────────────
  function text(
    str: string,
    x: number,
    y: number,
    opts: {
      font?: string;
      size?: number;
      color?: string;
      align?: "left" | "right" | "center";
      width?: number;
    } = {}
  ) {
    const {
      font = "Helvetica",
      size = 8,
      color = TEXT,
      align = "left",
      width,
    } = opts;
    setFill(doc, color);
    doc.font(font).fontSize(size);
    const textOpts: PDFKit.Mixins.TextOptions = { lineBreak: false };
    if (align !== "left") textOpts.align = align;
    if (width !== undefined) {
      textOpts.width = width;
      textOpts.lineBreak = true;
    }
    doc.text(str, x, y, textOpts);
  }

  function boldText(str: string, x: number, y: number, opts: Parameters<typeof text>[3] = {}) {
    text(str, x, y, { ...opts, font: "Helvetica-Bold" });
  }

  function hline(x1: number, y: number, x2: number, lw = 0.4) {
    setStroke(doc, BORDER);
    doc.lineWidth(lw).moveTo(x1, y).lineTo(x2, y).stroke();
  }

  function vline(x: number, y1: number, y2: number, lw = 0.4) {
    setStroke(doc, BORDER);
    doc.lineWidth(lw).moveTo(x, y1).lineTo(x, y2).stroke();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. OUTER BORDER
  // ═══════════════════════════════════════════════════════════════════════════
  setStroke(doc, BORDER);
  doc.lineWidth(1.2).rect(MAR, MAR, IW, PAGE_H - 2 * MAR).stroke();

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. HEADER (navy background)
  // ═══════════════════════════════════════════════════════════════════════════
  const HEADER_H = 38 * MM;
  fillRect(MAR, curY, IW, HEADER_H, NAVY);

  // Invoice type badge (top-right)
  const BADGE_W = 52 * MM;
  const BADGE_H = 7 * MM;
  const bx = MAR + IW - BADGE_W - 2 * MM;
  const by = curY + 2 * MM;
  setFill(doc, REDBADGE);
  doc.roundedRect(bx, by, BADGE_W, BADGE_H, 2).fill();
  boldText(data.invoiceType, bx, by + 1.5 * MM, {
    color: "#ffffff",
    size: 8,
    align: "center",
    width: BADGE_W,
  });

  // Company name
  boldText(data.company.name, MAR + 4 * MM, curY + 4 * MM, {
    color: "#ffffff",
    size: 16,
  });

  if (data.company.tagline) {
    text(data.company.tagline, MAR + 4 * MM, curY + 12 * MM, {
      color: "#adc8e8",
      size: 7,
    });
  }

  // Company details
  const companyLines = [
    data.company.address,
    `${data.company.city}, ${data.company.state} — ${data.company.pincode}`,
    `GSTIN: ${data.company.gstin}   PAN: ${data.company.pan}${data.company.cin ? "   CIN: " + data.company.cin : ""}`,
    `Ph: ${data.company.phone}   Email: ${data.company.email}${data.company.website ? "   " + data.company.website : ""}`,
  ];
  let cly = curY + 17 * MM;
  for (const line of companyLines) {
    text(line, MAR + 4 * MM, cly, { color: "#dce8f5", size: 7 });
    cly += 4 * MM;
  }

  // Invoice detail box (right side)
  const IBX = MAR + IW * 0.62;
  const IBW = IW * 0.38 - 2 * MM;
  const IBY = curY + 14 * MM;
  const IBH = HEADER_H - 16 * MM;
  setFill(doc, "#162d47");
  doc.roundedRect(IBX, IBY, IBW, IBH, 3).fill();

  text("Invoice No.", IBX + 3 * MM, IBY + 3 * MM, { color: "#adc8e8", size: 6.5 });
  boldText(data.number, IBX + 3 * MM, IBY + 7 * MM, { color: "#ffffff", size: 10 });

  const invoiceFields: Array<string[]> = [
    ["Date", data.date],
    ["Due Date", data.dueDate || ""],
    ["PO Number", data.poNumber || ""],
    ["Delivery", data.deliveryTerms || "Ex-Works"],
    ["Ref No.", data.referenceNo || ""],
  ].filter(([, v]) => v !== "");

  let iby = IBY + 16 * MM;
  for (const [label, val] of invoiceFields) {
    text(label, IBX + 3 * MM, iby, { color: "#adc8e8", size: 6 });
    text(val, IBX + 26 * MM, iby, { color: "#ffffff", size: 7.5 });
    iby += 4.5 * MM;
  }

  curY += HEADER_H;

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. BILL TO / SHIP TO HEADER BAR
  // ═══════════════════════════════════════════════════════════════════════════
  const BAR_H = 5.5 * MM;
  fillRect(MAR, curY, IW, BAR_H, NAVY2);
  boldText("BILL TO", MAR + 3 * MM, curY + 1.5 * MM, { color: "#ffffff", size: 7 });
  boldText("SHIP TO", MAR + IW / 2 + 3 * MM, curY + 1.5 * MM, { color: "#ffffff", size: 7 });
  curY += BAR_H;

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. CUSTOMER BOXES
  // ═══════════════════════════════════════════════════════════════════════════
  const CUST_H = 34 * MM;
  const halfW = IW / 2;

  strokeRect(MAR, curY, halfW, CUST_H);
  strokeRect(MAR + halfW, curY, halfW, CUST_H);

  function drawParty(party: InvoiceParty, cx: number, cy: number) {
    boldText(party.name, cx + 3 * MM, cy + 3 * MM, { color: TEXT, size: 8.5 });
    if (party.company) {
      text(party.company, cx + 3 * MM, cy + 8 * MM, { color: MUTED, size: 7.5 });
    }
    const lines = [
      party.address,
      `${party.city}, ${party.state} — ${party.pincode}`,
      `GSTIN: ${party.gstin || "Unregistered"}`,
      `State: ${party.state} (${party.stateCode})${party.phone ? "   Ph: " + party.phone : ""}`,
    ];
    let ly = cy + (party.company ? 13 : 10) * MM;
    for (const l of lines) {
      text(l, cx + 3 * MM, ly, { color: MUTED, size: 7 });
      ly += 3.8 * MM;
    }
  }

  drawParty(data.billTo, MAR, curY);
  drawParty(data.shipTo || data.billTo, MAR + halfW, curY);
  curY += CUST_H;

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. TRANSPORT STRIP
  // ═══════════════════════════════════════════════════════════════════════════
  const TRANS_H = 6 * MM;
  fillRect(MAR, curY, IW, TRANS_H, ALTROW);
  hline(MAR, curY, MAR + IW);
  hline(MAR, curY + TRANS_H, MAR + IW);

  if (data.transport) {
    const tfields: Array<string[]> = [
      ["Transport", data.transport.name || ""],
      ["Vehicle", data.transport.vehicle || ""],
      ["LR No.", data.transport.lrNo || ""],
      ["Dispatch Date", data.dispatchDate || ""],
      ["Destination", data.transport.destination || ""],
    ].filter(([, v]) => v !== "");

    let tx = MAR + 3 * MM;
    for (const [label, val] of tfields) {
      text(label + ": ", tx, curY + 1.8 * MM, { color: MUTED, size: 6.5 });
      const lw = doc.widthOfString(label + ": ");
      boldText(val, tx + lw, curY + 1.8 * MM, { color: TEXT, size: 6.5 });
      tx += lw + doc.widthOfString(val) + 8 * MM;
      if (tx > MAR + IW - 30 * MM) break;
    }
  }
  curY += TRANS_H;

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. PRODUCT TABLE
  // ═══════════════════════════════════════════════════════════════════════════

  // Column definitions [label, width_fraction, align]
  type ColAlign = "left" | "right" | "center";
  const COLS: [string, number, ColAlign][] = [
    ["Sl\nNo.", 0.045, "center"],
    ["Product & Description", 0.26,  "left"],
    ["HSN\nCode", 0.085, "center"],
    ["Qty &\nUnit", 0.085, "center"],
    ["Rate\n(\u20B9)", 0.09, "right"],
    ["Disc\n(%)", 0.065, "center"],
    ["Tax\n(%)", 0.065, "center"],
    ["Tax Amt\n(\u20B9)", 0.095, "right"],
    ["Amount\n(\u20B9)", 0.11, "right"],
  ];

  const colWidths = COLS.map(([, f]) => f * IW);
  const COL_H_HEADER = 10 * MM;
  const COL_H_ROW    = 9 * MM;

  // Table header
  fillRect(MAR, curY, IW, COL_H_HEADER, NAVY2);
  hline(MAR, curY + COL_H_HEADER, MAR + IW, 0.5);

  let colX = MAR;
  for (let i = 0; i < COLS.length; i++) {
    const [label, , align] = COLS[i];
    const cw = colWidths[i];
    const lines = label.split("\n");
    const lineH = 3.5 * MM;
    const totalH = lines.length * lineH;
    let ly = curY + (COL_H_HEADER - totalH) / 2;
    for (const line of lines) {
      if (align === "center") {
        boldText(line, colX, ly, { color: "#ffffff", size: 6.5, align: "center", width: cw });
      } else if (align === "right") {
        boldText(line, colX, ly, { color: "#ffffff", size: 6.5, align: "right", width: cw - 2 * MM });
      } else {
        boldText(line, colX + 2 * MM, ly, { color: "#ffffff", size: 6.5 });
      }
      ly += lineH;
    }
    if (i < COLS.length - 1) {
      vline(colX + cw, curY, curY + COL_H_HEADER, 0.3);
    }
    colX += cw;
  }
  curY += COL_H_HEADER;

  // Rows
  for (let idx = 0; idx < calc.items.length; idx++) {
    const item = calc.items[idx];
    const rowBg = idx % 2 === 1 ? ALTROW : "#ffffff";
    fillRect(MAR, curY, IW, COL_H_ROW, rowBg);
    hline(MAR, curY + COL_H_ROW, MAR + IW, 0.3);

    const rowMid = curY + COL_H_ROW / 2 - 2.5 * MM;

    const cellValues: [string, string | number, ColAlign][] = [
      ["", String(idx + 1), "center"],
      ["", item.name, "left"],
      ["", item.hsn, "center"],
      ["", `${item.qty} ${item.unit}`, "center"],
      ["", formatCurrency(item.rate), "right"],
      ["", item.discountPct ? `${item.discountPct}%` : "—", "center"],
      ["", `${item.taxPct}%`, "center"],
      ["", formatCurrency(item.taxAmt), "right"],
      ["", formatCurrency(item.totalAmt), "right"],
    ];

    colX = MAR;
    for (let ci = 0; ci < cellValues.length; ci++) {
      const [, val, align] = cellValues[ci];
      const cw = colWidths[ci];
      const isName = ci === 1;

      if (isName) {
        boldText(String(val), colX + 2 * MM, curY + 2 * MM, { color: TEXT, size: 7.5, width: cw - 3 * MM });
        if (item.description) {
          text(item.description, colX + 2 * MM, curY + 6 * MM, { color: MUTED, size: 6.5, width: cw - 3 * MM });
        }
      } else if (align === "right") {
        text(String(val), colX, rowMid, { color: TEXT, size: 7.5, align: "right", width: cw - 2 * MM });
      } else if (align === "center") {
        text(String(val), colX, rowMid, { color: TEXT, size: 7.5, align: "center", width: cw });
      } else {
        text(String(val), colX + 2 * MM, rowMid, { color: TEXT, size: 7.5 });
      }

      if (ci < cellValues.length - 1) {
        vline(colX + cw, curY, curY + COL_H_ROW, 0.3);
      }
      colX += cw;
    }
    curY += COL_H_ROW;
  }

  // Fill empty rows to at least 8 lines
  const emptyRows = Math.max(0, 7 - calc.items.length);
  for (let i = 0; i < emptyRows; i++) {
    const rowBg = (calc.items.length + i) % 2 === 1 ? ALTROW : "#ffffff";
    fillRect(MAR, curY, IW, COL_H_ROW, rowBg);
    hline(MAR, curY + COL_H_ROW, MAR + IW, 0.3);
    curY += COL_H_ROW;
  }

  // Bottom of table border
  hline(MAR, curY, MAR + IW, 0.8);

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. CHARGES + SUBTOTALS (right column) / NOTES (left column)
  // ═══════════════════════════════════════════════════════════════════════════
  const NOTES_W = IW * 0.52;
  const CHARGES_W = IW - NOTES_W;
  const chargesStartY = curY;

  const ROW_CH = 6 * MM;
  type ChargeRow = [string, number, boolean, string | null];
  const chargeRows: ChargeRow[] = [
    ["Sub Total", calc.subtotal, false, null],
    ...(calc.totalDiscount > 0 ? [["Trade Discount (-)", calc.totalDiscount, false, null] as ChargeRow] : []),
    ...(calc.freight  ? [["Freight Charges", calc.freight, false, ALTROW] as ChargeRow] : []),
    ...(calc.loading  ? [["Loading Charges", calc.loading, false, null] as ChargeRow] : []),
    ...(calc.packing  ? [["Packing Charges", calc.packing, false, ALTROW] as ChargeRow] : []),
    ...(calc.other    ? [[(data.charges?.otherLabel || "Other Charges"), calc.other, false, null] as ChargeRow] : []),
    ["Taxable Amount", calc.grandTaxable, true, "#dbeafe"],
    ...Array.from(calc.taxBuckets.values()).flatMap((b, i): ChargeRow[] => {
      if (calc.isIGST) {
        return [[`IGST @ ${b.taxPct}%`, b.tax, false, i % 2 === 0 ? ALTROW : null]];
      } else {
        return [
          [`CGST @ ${b.taxPct / 2}%`, b.tax / 2, false, i % 2 === 0 ? ALTROW : null],
          [`SGST @ ${b.taxPct / 2}%`, b.tax / 2, false, null],
        ];
      }
    }),
  ];

  const totalChargesH = (1 + chargeRows.length) * ROW_CH;

  // Notes box (left)
  fillRect(MAR, chargesStartY, NOTES_W - 1 * MM, totalChargesH, "#fafbfc");
  strokeRect(MAR, chargesStartY, NOTES_W - 1 * MM, totalChargesH);

  if (data.notes) {
    boldText("Notes / Remarks", MAR + 3 * MM, chargesStartY + 3 * MM, { color: MUTED, size: 7 });
    text(data.notes, MAR + 3 * MM, chargesStartY + 8 * MM, {
      color: TEXT, size: 7.5, width: NOTES_W - 6 * MM,
    });
  }

  // Charges box (right)
  const CX = MAR + NOTES_W;
  fillRect(CX, chargesStartY, CHARGES_W, totalChargesH, "#ffffff");
  strokeRect(CX, chargesStartY, CHARGES_W, totalChargesH);

  // Charges header
  fillRect(CX, chargesStartY, CHARGES_W, ROW_CH, NAVY2);
  boldText("Particulars", CX + 3 * MM, chargesStartY + 2 * MM, { color: "#ffffff", size: 6.5 });
  boldText("Amount (\u20B9)", CX + CHARGES_W - 2 * MM, chargesStartY + 2 * MM, {
    color: "#ffffff", size: 6.5, align: "right", width: CHARGES_W - 4 * MM,
  });

  let chY = chargesStartY + ROW_CH;
  for (const [label, amount, bold, bg] of chargeRows) {
    if (bg) fillRect(CX, chY, CHARGES_W, ROW_CH, bg);
    hline(CX, chY, CX + CHARGES_W, 0.3);
    const fn = bold ? "Helvetica-Bold" : "Helvetica";
    setFill(doc, TEXT);
    doc.font(fn).fontSize(7.5).text(label, CX + 3 * MM, chY + 1.8 * MM, { lineBreak: false });
    setFill(doc, TEXT);
    doc.font(fn).fontSize(7.5).text(formatCurrency(amount), CX, chY + 1.8 * MM, {
      width: CHARGES_W - 3 * MM, align: "right", lineBreak: false,
    });
    chY += ROW_CH;
  }

  curY = chargesStartY + totalChargesH;

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. GRAND TOTAL BAR
  // ═══════════════════════════════════════════════════════════════════════════
  const GT_H = 9 * MM;
  fillRect(MAR, curY, IW, GT_H, NAVY);
  boldText("GRAND TOTAL", MAR + 5 * MM, curY + 2.5 * MM, { color: "#ffffff", size: 10 });
  boldText(formatCurrency(calc.grandTotal), MAR + IW - 4 * MM, curY + 2 * MM, {
    color: "#ffffff", size: 12, align: "right", width: IW - 8 * MM,
  });
  curY += GT_H;

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. AMOUNT IN WORDS
  // ═══════════════════════════════════════════════════════════════════════════
  const AW_H = 7 * MM;
  fillRect(MAR, curY, IW, AW_H, WORDBG);
  strokeRect(MAR, curY, IW, AW_H);
  boldText("Amount in Words:", MAR + 3 * MM, curY + 2.5 * MM, { color: MUTED, size: 7 });
  boldText(calc.amountInWords, MAR + 38 * MM, curY + 2.5 * MM, { color: "#7c3a00", size: 7.5 });
  curY += AW_H;

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. GST TAX SUMMARY TABLE
  // ═══════════════════════════════════════════════════════════════════════════
  const TS_LABEL_H = 5.5 * MM;
  fillRect(MAR, curY, IW, TS_LABEL_H, NAVY2);
  boldText("GST TAX SUMMARY", MAR + 3 * MM, curY + 1.5 * MM, { color: "#ffffff", size: 7.5 });
  curY += TS_LABEL_H;

  type TSCol = [string, number, ColAlign];
  const tsCols: TSCol[] = calc.isIGST
    ? [
        ["HSN / SAC", 0.28, "left"],
        ["Taxable Value", 0.20, "right"],
        ["IGST Rate", 0.17, "center"],
        ["IGST Amount", 0.20, "right"],
        ["Total Tax", 0.15, "right"],
      ]
    : [
        ["HSN / SAC", 0.22, "left"],
        ["Taxable Value", 0.16, "right"],
        ["CGST Rate", 0.11, "center"],
        ["CGST Amount", 0.14, "right"],
        ["SGST Rate", 0.11, "center"],
        ["SGST Amount", 0.14, "right"],
        ["Total Tax", 0.12, "right"],
      ];

  const tsColW = tsCols.map(([, f]) => f * IW);
  const TS_ROW_H = 6.5 * MM;

  // Header
  fillRect(MAR, curY, IW, TS_ROW_H, NAVY2);
  let tsx = MAR;
  for (let i = 0; i < tsCols.length; i++) {
    const [label, , align] = tsCols[i];
    const cw = tsColW[i];
    boldText(label, tsx + (align === "left" ? 2 * MM : 0), curY + 2 * MM, {
      color: "#ffffff", size: 6.5, align, width: align !== "left" ? cw - 2 * MM : cw,
    });
    if (i < tsCols.length - 1) vline(tsx + cw, curY, curY + TS_ROW_H, 0.3);
    tsx += cw;
  }
  hline(MAR, curY + TS_ROW_H, MAR + IW, 0.5);
  curY += TS_ROW_H;

  // Build tax rows from items (grouped by HSN)
  const hsnMap = new Map<string, { taxable: number; tax: number; taxPct: number }>();
  for (const item of calc.items) {
    const k = item.hsn || "N/A";
    const ex = hsnMap.get(k) || { taxable: 0, tax: 0, taxPct: item.taxPct };
    ex.taxable += item.taxableAmt;
    ex.tax     += item.taxAmt;
    hsnMap.set(k, ex);
  }

  let tsRowIdx = 0;
  let tsTotalTaxable = 0, tsTotalTax = 0;

  for (const [hsn, vals] of hsnMap) {
    const rowBg = tsRowIdx % 2 === 1 ? TAXBG : "#ffffff";
    fillRect(MAR, curY, IW, TS_ROW_H, rowBg);
    hline(MAR, curY + TS_ROW_H, MAR + IW, 0.3);
    tsTotalTaxable += vals.taxable;
    tsTotalTax     += vals.tax;

    const rowVals: [string, ColAlign][] = calc.isIGST
      ? [
          [hsn, "left"],
          [formatCurrency(vals.taxable), "right"],
          [`${vals.taxPct}%`, "center"],
          [formatCurrency(vals.tax), "right"],
          [formatCurrency(vals.tax), "right"],
        ]
      : [
          [hsn, "left"],
          [formatCurrency(vals.taxable), "right"],
          [`${vals.taxPct / 2}%`, "center"],
          [formatCurrency(vals.tax / 2), "right"],
          [`${vals.taxPct / 2}%`, "center"],
          [formatCurrency(vals.tax / 2), "right"],
          [formatCurrency(vals.tax), "right"],
        ];

    tsx = MAR;
    for (let ci = 0; ci < rowVals.length; ci++) {
      const [val, align] = rowVals[ci];
      const cw = tsColW[ci];
      text(val, tsx + (align === "left" ? 2 * MM : 0), curY + 2 * MM, {
        size: 7.5, color: TEXT, align, width: align !== "left" ? cw - 2 * MM : cw,
      });
      if (ci < rowVals.length - 1) vline(tsx + cw, curY, curY + TS_ROW_H, 0.3);
      tsx += cw;
    }
    curY += TS_ROW_H;
    tsRowIdx++;
  }

  // Totals row
  fillRect(MAR, curY, IW, TS_ROW_H, "#dbeafe");
  hline(MAR, curY + TS_ROW_H, MAR + IW, 0.5);

  const totalRowVals: [string, ColAlign][] = calc.isIGST
    ? [
        ["TOTAL", "left"],
        [formatCurrency(tsTotalTaxable), "right"],
        ["", "center"],
        [formatCurrency(tsTotalTax), "right"],
        [formatCurrency(tsTotalTax), "right"],
      ]
    : [
        ["TOTAL", "left"],
        [formatCurrency(tsTotalTaxable), "right"],
        ["", "center"],
        [formatCurrency(tsTotalTax / 2), "right"],
        ["", "center"],
        [formatCurrency(tsTotalTax / 2), "right"],
        [formatCurrency(tsTotalTax), "right"],
      ];

  tsx = MAR;
  for (let ci = 0; ci < totalRowVals.length; ci++) {
    const [val, align] = totalRowVals[ci];
    const cw = tsColW[ci];
    boldText(val, tsx + (align === "left" ? 2 * MM : 0), curY + 2 * MM, {
      size: 7.5, color: NAVY, align, width: align !== "left" ? cw - 2 * MM : cw,
    });
    if (ci < totalRowVals.length - 1) vline(tsx + cw, curY, curY + TS_ROW_H, 0.3);
    tsx += cw;
  }
  curY += TS_ROW_H;

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. FOOTER (Declaration | Terms | Signatory)
  // ═════════════════���═════════════════════════════════════════════════════════
  const FOOTER_Y = PAGE_H - MAR - 28 * MM;
  const FOOTER_H = PAGE_H - MAR - FOOTER_Y;
  const footColW = IW / 3;

  // Declaration
  fillRect(MAR, FOOTER_Y, footColW - 1 * MM, FOOTER_H, FOOTBG);
  strokeRect(MAR, FOOTER_Y, footColW - 1 * MM, FOOTER_H);
  boldText("Declaration", MAR + 3 * MM, FOOTER_Y + 3 * MM, { color: MUTED, size: 7 });
  const decl = data.declaration ||
    "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";
  text(decl, MAR + 3 * MM, FOOTER_Y + 8 * MM, { color: TEXT, size: 6.5, width: footColW - 6 * MM });

  // Terms
  const termsX = MAR + footColW;
  fillRect(termsX, FOOTER_Y, footColW - 1 * MM, FOOTER_H, FOOTBG);
  strokeRect(termsX, FOOTER_Y, footColW - 1 * MM, FOOTER_H);
  boldText("Terms & Conditions", termsX + 3 * MM, FOOTER_Y + 3 * MM, { color: MUTED, size: 7 });

  const defaultTerms = [
    "1. Goods once sold will not be taken back.",
    "2. Interest @ 18% p.a. on overdue payment.",
    "3. Subject to local jurisdiction only.",
    "4. E & O.E.",
  ];
  const terms = data.terms || defaultTerms;
  let tly = FOOTER_Y + 8 * MM;
  for (const t of terms) {
    text(t, termsX + 3 * MM, tly, { color: TEXT, size: 6.5, width: footColW - 6 * MM });
    tly += 4 * MM;
  }

  // Authorized signatory
  const sigX = MAR + footColW * 2;
  fillRect(sigX, FOOTER_Y, footColW, FOOTER_H, SIGBG);
  strokeRect(sigX, FOOTER_Y, footColW, FOOTER_H);
  boldText(`For ${data.company.name}`, sigX + 3 * MM, FOOTER_Y + 3 * MM, { color: MUTED, size: 7 });

  // Seal circle
  const sealCX = sigX + footColW / 2;
  const sealCY = FOOTER_Y + FOOTER_H / 2;
  setFill(doc, "#e8eeff");
  setStroke(doc, BORDER);
  doc.lineWidth(0.8).circle(sealCX, sealCY, 10 * MM).fillAndStroke();
  text("COMPANY", sealCX - 12 * MM, sealCY - 2 * MM, { color: BORDER, size: 6, width: 24 * MM, align: "center" });
  text("SEAL", sealCX - 12 * MM, sealCY + 2 * MM, { color: BORDER, size: 6, width: 24 * MM, align: "center" });

  // Signature line
  hline(sigX + 5 * MM, FOOTER_Y + FOOTER_H - 8 * MM, sigX + footColW - 5 * MM, 0.6);
  text("Authorised Signatory", sigX, FOOTER_Y + FOOTER_H - 5 * MM, {
    color: MUTED, size: 7, align: "center", width: footColW,
  });

  // Page number + GSTIN footer
  text(
    `Page 1 of 1   |   ${data.company.name}   |   GSTIN: ${data.company.gstin}`,
    MAR,
    PAGE_H - MAR + 2 * MM,
    { color: MUTED, size: 6, align: "center", width: IW }
  );

  doc.end();
  return Buffer.concat(chunks);
}
