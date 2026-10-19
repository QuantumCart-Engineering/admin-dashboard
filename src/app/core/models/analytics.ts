export type ReportBucket = 'day' | 'month';

export interface ReportRange {
  from: string;
  to: string;
}

export interface ReportRangeEcho {
  from: string;
  to: string;
}

export interface OrderReportSummary {
  range: ReportRangeEcho;
  totalOrders: number;
  pendingPaymentOrders: number;
  confirmedOrders: number;
  cancelledOrders: number;
  grossSales: number;
  pendingValue: number;
  cancelledValue: number;
  averageOrderValue: number;
}

export interface OrderReportPoint {
  period: string;
  orders: number;
  confirmedOrders: number;
  grossSales: number;
}

export interface OrderReportTimeseries {
  range: ReportRangeEcho;
  bucket: ReportBucket;
  points: OrderReportPoint[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  unitsSold: number;
  revenue: number;
}

export interface OrderTopProducts {
  range: ReportRangeEcho;
  limit: number;
  products: TopProduct[];
}

export interface PaymentReportSummary {
  range: ReportRangeEcho;
  totalPayments: number;
  initiated: number;
  processing: number;
  success: number;
  failed: number;
  refundPending: number;
  refunded: number;
  successfulAmount: number;
  successRate: number;
}

export interface PaymentReportPoint {
  period: string;
  success: number;
  failed: number;
  amount: number;
}

export interface PaymentReportTimeseries {
  range: ReportRangeEcho;
  bucket: ReportBucket;
  points: PaymentReportPoint[];
}

export interface CustomerReportSummary {
  range: ReportRangeEcho;
  totalCustomers: number;
  activeCustomers: number;
  blockedCustomers: number;
  deletedCustomers: number;
  newCustomers: number;
}

export interface ProductReportSummary {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStockStatusProducts: number;
  archivedProducts: number;
  activeOutOfStock: number;
  activeLowStock: number;
  activeInStock: number;
  lowStockThreshold: number;
  totalCategories: number;
  activeCategories: number;
}
