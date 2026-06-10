// types/index.ts

export type UserRole = "ADMIN" | "STAFF";
export type ProductStatus = "ACTIVE" | "INACTIVE";
export type UnitType = "KG" | "GRAM" | "LITER" | "MILLILITER" | "PIECE" | "PACKET" | "BOTTLE" | "BOX";
export type SellMethod = "BY_QUANTITY" | "BY_WEIGHT";
export type MovementType = "PURCHASE" | "SALE" | "DAMAGE" | "RETURN_IN" | "RETURN_OUT" | "ADJUSTMENT" | "INTERNAL_USAGE" | "EXPIRY";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "CREDIT";
export type BillStatus = "DRAFT" | "PAID" | "CANCELLED";
export type ExpenseCategory = "RENT" | "ELECTRICITY" | "SALARY" | "INTERNET" | "MAINTENANCE" | "MISCELLANEOUS";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  isDefault: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  image?: string;
  categoryId: string;
  category: Category;
  unitType: UnitType;
  sellMethod: SellMethod;
  status: ProductStatus;
  minStock: number;
  variants: ProductVariant[];
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  isActive: boolean;
}

export interface BillItem {
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  discount?: number;
  totalPrice: number;
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  billDate: string;
  customerName?: string;
  customerPhone?: string;
  status: BillStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  discountType: string;
  tax: number;
  taxPercent: number;
  totalAmount: number;
  amountPaid: number;
  change: number;
  items: BillItem[];
  user: { name: string };
  createdAt: string;
}

export interface CartItem {
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unit: string;
  sellMethod: SellMethod;
  sellingPrice: number;
  stock: number;
  discount?: number;
}

export interface DashboardStats {
  todayRevenue: number;
  todayBillCount: number;
  monthRevenue: number;
  monthProfit: number;
  inventoryValue: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface SalesTrend {
  period: string;
  revenue: number;
  count: number;
}

export interface TopProduct {
  variantId: string;
  productName: string;
  variantName: string;
  quantitySold: number;
  revenue: number;
}

export interface StockMovement {
  id: string;
  variantId: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  user: { name: string };
  variant: { name: string; product: { name: string } };
}

export interface Notification {
  id: string;
  type: "LOW_STOCK" | "OUT_OF_STOCK" | "PRICE_CHANGE" | "SYSTEM";
  title: string;
  message: string;
  entityId?: string;
  status: "UNREAD" | "READ";
  createdAt: string;
}

export interface Settings {
  id: string;
  businessName: string;
  logo?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  address?: string;
  invoicePrefix: string;
  taxPercent: number;
  currency: string;
  currencySymbol: string;
  enableTax: boolean;
  enableDiscount: boolean;
  lowStockDefault: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationMeta;
  error?: string;
}
