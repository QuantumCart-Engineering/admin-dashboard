import { Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AnalyticsApi } from '../../../core/api/analytics-api';
import { NotificationService } from '../../../core/services/notification.service';
import { toCsv, downloadCsv, CsvColumn } from '../../../core/utils/csv';
import { formatCurrency } from '../../../core/utils/money';
import { formatPeriodLabel, presetRange } from '../../../core/utils/report-range';
import type {
  CustomerReportSummary,
  OrderReportSummary,
  OrderReportTimeseries,
  OrderTopProducts,
  PaymentReportSummary,
  PaymentReportTimeseries,
  ProductReportSummary,
  ReportBucket,
  ReportRange,
} from '../../../core/models/analytics';
import { RangeBar } from '../../../shared/components/range-bar/range-bar';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

interface KeyValue {
  label: string;
  value: string;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [RangeBar, Skeleton, EmptyState],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.css',
})
export class ReportsPage implements OnInit {
  private readonly analytics = inject(AnalyticsApi);
  private readonly notify = inject(NotificationService);

  readonly range = signal<ReportRange>(presetRange('30d'));
  readonly bucket = signal<ReportBucket>('day');
  readonly loading = signal(true);

  readonly orderSummary = signal<OrderReportSummary | null>(null);
  readonly orderTimeseries = signal<OrderReportTimeseries | null>(null);
  readonly topProducts = signal<OrderTopProducts | null>(null);
  readonly paymentSummary = signal<PaymentReportSummary | null>(null);
  readonly paymentTimeseries = signal<PaymentReportTimeseries | null>(null);
  readonly customerSummary = signal<CustomerReportSummary | null>(null);
  readonly productSummary = signal<ProductReportSummary | null>(null);

  readonly money = formatCurrency;

  ngOnInit(): void {
    void this.load();
  }

  onRangeChange(next: ReportRange) {
    this.range.set(next);
    void this.load();
  }

  setBucket(bucket: ReportBucket) {
    if (this.bucket() === bucket) {
      return;
    }
    this.bucket.set(bucket);
    void this.load();
  }

  refresh() {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    const range = this.range();
    const bucket = this.bucket();

    const [
      orderSummary,
      orderTimeseries,
      topProducts,
      paymentSummary,
      paymentTimeseries,
      customerSummary,
      productSummary,
    ] = await Promise.allSettled([
      firstValueFrom(this.analytics.getOrderSummary(range)),
      firstValueFrom(this.analytics.getOrderTimeseries(range, bucket)),
      firstValueFrom(this.analytics.getTopProducts(range, 10)),
      firstValueFrom(this.analytics.getPaymentSummary(range)),
      firstValueFrom(this.analytics.getPaymentTimeseries(range, bucket)),
      firstValueFrom(this.analytics.getCustomerSummary(range)),
      firstValueFrom(this.analytics.getProductSummary(10)),
    ]);

    this.orderSummary.set(orderSummary.status === 'fulfilled' ? orderSummary.value : null);
    this.orderTimeseries.set(orderTimeseries.status === 'fulfilled' ? orderTimeseries.value : null);
    this.topProducts.set(topProducts.status === 'fulfilled' ? topProducts.value : null);
    this.paymentSummary.set(paymentSummary.status === 'fulfilled' ? paymentSummary.value : null);
    this.paymentTimeseries.set(
      paymentTimeseries.status === 'fulfilled' ? paymentTimeseries.value : null,
    );
    this.customerSummary.set(customerSummary.status === 'fulfilled' ? customerSummary.value : null);
    this.productSummary.set(productSummary.status === 'fulfilled' ? productSummary.value : null);

    const rejected = [
      [orderSummary, 'order summary'],
      [orderTimeseries, 'order timeseries'],
      [topProducts, 'top products'],
      [paymentSummary, 'payment summary'],
      [paymentTimeseries, 'payment timeseries'],
      [customerSummary, 'customer summary'],
      [productSummary, 'product summary'],
    ] as const;

    for (const [result, label] of rejected) {
      if (result.status === 'rejected') {
        this.notify.showWarning(`Could not load the ${label}.`);
      }
    }

    this.loading.set(false);
  }

  periodLabel(period: string): string {
    return formatPeriodLabel(period);
  }

  orderSummaryRows(): KeyValue[] {
    const summary = this.orderSummary();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Total orders', value: String(summary.totalOrders) },
      { label: 'Confirmed orders', value: String(summary.confirmedOrders) },
      { label: 'Pending payment orders', value: String(summary.pendingPaymentOrders) },
      { label: 'Cancelled orders', value: String(summary.cancelledOrders) },
      { label: 'Gross sales', value: this.money(summary.grossSales) },
      { label: 'Pending value', value: this.money(summary.pendingValue) },
      { label: 'Cancelled value', value: this.money(summary.cancelledValue) },
      { label: 'Average order value', value: this.money(summary.averageOrderValue) },
    ];
  }

  paymentSummaryRows(): KeyValue[] {
    const summary = this.paymentSummary();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Total payments', value: String(summary.totalPayments) },
      { label: 'Successful', value: String(summary.success) },
      { label: 'Failed', value: String(summary.failed) },
      { label: 'Processing', value: String(summary.processing) },
      { label: 'Initiated', value: String(summary.initiated) },
      { label: 'Refund pending', value: String(summary.refundPending) },
      { label: 'Refunded', value: String(summary.refunded) },
      { label: 'Successful amount', value: this.money(summary.successfulAmount) },
      { label: 'Success rate', value: `${summary.successRate.toFixed(2)}%` },
    ];
  }

  customerSummaryRows(): KeyValue[] {
    const summary = this.customerSummary();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Total customers', value: String(summary.totalCustomers) },
      { label: 'Active', value: String(summary.activeCustomers) },
      { label: 'Blocked', value: String(summary.blockedCustomers) },
      { label: 'Deleted', value: String(summary.deletedCustomers) },
      { label: 'New in range', value: String(summary.newCustomers) },
    ];
  }

  productSummaryRows(): KeyValue[] {
    const summary = this.productSummary();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Total products', value: String(summary.totalProducts) },
      { label: 'Active', value: String(summary.activeProducts) },
      { label: 'Inactive', value: String(summary.inactiveProducts) },
      { label: 'Out of stock (status)', value: String(summary.outOfStockStatusProducts) },
      { label: 'Archived', value: String(summary.archivedProducts) },
      { label: 'Active out of stock', value: String(summary.activeOutOfStock) },
      { label: 'Active low stock', value: String(summary.activeLowStock) },
      { label: 'Active in stock', value: String(summary.activeInStock) },
      { label: 'Low stock threshold', value: String(summary.lowStockThreshold) },
      { label: 'Total categories', value: String(summary.totalCategories) },
      { label: 'Active categories', value: String(summary.activeCategories) },
    ];
  }

  exportOrderSummary() {
    this.exportKeyValues('order-summary', this.orderSummaryRows());
  }

  exportPaymentSummary() {
    this.exportKeyValues('payment-summary', this.paymentSummaryRows());
  }

  exportCustomerSummary() {
    this.exportKeyValues('customer-summary', this.customerSummaryRows());
  }

  exportProductSummary() {
    this.exportKeyValues('product-summary', this.productSummaryRows());
  }

  exportOrderTimeseries() {
    const data = this.orderTimeseries();
    if (!data) {
      return;
    }
    const columns: CsvColumn<(typeof data.points)[number]>[] = [
      { header: 'Period', value: (row) => row.period },
      { header: 'Orders', value: (row) => row.orders },
      { header: 'Confirmed orders', value: (row) => row.confirmedOrders },
      { header: 'Gross sales', value: (row) => row.grossSales },
    ];
    this.download('order-timeseries', data.points, columns);
  }

  exportPaymentTimeseries() {
    const data = this.paymentTimeseries();
    if (!data) {
      return;
    }
    const columns: CsvColumn<(typeof data.points)[number]>[] = [
      { header: 'Period', value: (row) => row.period },
      { header: 'Successful', value: (row) => row.success },
      { header: 'Failed', value: (row) => row.failed },
      { header: 'Successful amount', value: (row) => row.amount },
    ];
    this.download('payment-timeseries', data.points, columns);
  }

  exportTopProducts() {
    const data = this.topProducts();
    if (!data) {
      return;
    }
    const columns: CsvColumn<(typeof data.products)[number]>[] = [
      { header: 'Product', value: (row) => row.productName },
      { header: 'SKU', value: (row) => row.sku },
      { header: 'Units sold', value: (row) => row.unitsSold },
      { header: 'Revenue', value: (row) => row.revenue },
      { header: 'Product ID', value: (row) => row.productId },
    ];
    this.download('top-products', data.products, columns);
  }

  private exportKeyValues(name: string, rows: KeyValue[]) {
    this.download(name, rows, [
      { header: 'Metric', value: (row) => row.label },
      { header: 'Value', value: (row) => row.value },
    ]);
  }

  private download<T>(name: string, rows: T[], columns: CsvColumn<T>[]) {
    const range = this.range();
    const csv = toCsv(rows, columns);
    downloadCsv(`${name}_${range.from}_${range.to}.csv`, csv);
    this.notify.showSuccess('CSV export started.');
  }
}
