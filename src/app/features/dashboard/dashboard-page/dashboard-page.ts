import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AnalyticsApi } from '../../../core/api/analytics-api';
import { NotificationService } from '../../../core/services/notification.service';
import { formatCompactCurrency, formatCurrency } from '../../../core/utils/money';
import { formatPeriodLabel, presetRange } from '../../../core/utils/report-range';
import { CHART_COLORS } from '../../../core/utils/chart-palette';
import type {
  CustomerReportSummary,
  OrderReportPoint,
  OrderReportSummary,
  PaymentReportPoint,
  PaymentReportSummary,
  ProductReportSummary,
  ReportBucket,
  ReportRange,
  TopProduct,
} from '../../../core/models/analytics';
import type { LineSeries } from '../../../shared/components/charts/line-chart';
import type { BarItem } from '../../../shared/components/charts/bar-chart';
import type { DonutSegment } from '../../../shared/components/charts/donut-chart';
import { LineChart } from '../../../shared/components/charts/line-chart';
import { BarChart } from '../../../shared/components/charts/bar-chart';
import { DonutChart } from '../../../shared/components/charts/donut-chart';
import { RangeBar } from '../../../shared/components/range-bar/range-bar';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Skeleton } from '../../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, LineChart, BarChart, DonutChart, RangeBar, EmptyState, Skeleton],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css',
})
export class DashboardPage implements OnInit {
  private readonly analytics = inject(AnalyticsApi);
  private readonly notify = inject(NotificationService);

  readonly range = signal<ReportRange>(presetRange('30d'));
  readonly bucket = signal<ReportBucket>('day');
  readonly loading = signal(true);
  readonly productLoading = signal(true);

  readonly orderSummary = signal<OrderReportSummary | null>(null);
  readonly paymentSummary = signal<PaymentReportSummary | null>(null);
  readonly customerSummary = signal<CustomerReportSummary | null>(null);
  readonly orderPoints = signal<OrderReportPoint[]>([]);
  readonly paymentPoints = signal<PaymentReportPoint[]>([]);
  readonly topProducts = signal<TopProduct[]>([]);
  readonly productSummary = signal<ProductReportSummary | null>(null);

  readonly money = formatCurrency;
  readonly compactMoney = formatCompactCurrency;
  readonly moneyFormatter = (value: number) => formatCompactCurrency(value);
  readonly countFormatter = (value: number) => new Intl.NumberFormat('en-IN').format(Math.round(value));

  ngOnInit(): void {
    void this.loadProductSummary();
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
    void this.loadProductSummary();
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
    ] = await Promise.allSettled([
      firstValueFrom(this.analytics.getOrderSummary(range)),
      firstValueFrom(this.analytics.getOrderTimeseries(range, bucket)),
      firstValueFrom(this.analytics.getTopProducts(range, 10)),
      firstValueFrom(this.analytics.getPaymentSummary(range)),
      firstValueFrom(this.analytics.getPaymentTimeseries(range, bucket)),
      firstValueFrom(this.analytics.getCustomerSummary(range)),
    ]);

    this.orderSummary.set(orderSummary.status === 'fulfilled' ? orderSummary.value : null);
    this.orderPoints.set(orderTimeseries.status === 'fulfilled' ? orderTimeseries.value.points : []);
    this.topProducts.set(topProducts.status === 'fulfilled' ? topProducts.value.products : []);
    this.paymentSummary.set(paymentSummary.status === 'fulfilled' ? paymentSummary.value : null);
    this.paymentPoints.set(
      paymentTimeseries.status === 'fulfilled' ? paymentTimeseries.value.points : [],
    );
    this.customerSummary.set(customerSummary.status === 'fulfilled' ? customerSummary.value : null);

    if (orderSummary.status === 'rejected') {
      this.notify.showWarning('Could not load the order summary.');
    }
    if (orderTimeseries.status === 'rejected') {
      this.notify.showWarning('Could not load the order trend.');
    }
    if (topProducts.status === 'rejected') {
      this.notify.showWarning('Could not load top products.');
    }
    if (paymentSummary.status === 'rejected') {
      this.notify.showWarning('Could not load the payment summary.');
    }
    if (paymentTimeseries.status === 'rejected') {
      this.notify.showWarning('Could not load the payment trend.');
    }
    if (customerSummary.status === 'rejected') {
      this.notify.showWarning('Could not load the customer summary.');
    }

    this.loading.set(false);
  }

  async loadProductSummary() {
    this.productLoading.set(true);
    try {
      this.productSummary.set(await firstValueFrom(this.analytics.getProductSummary(10)));
    } catch {
      this.productSummary.set(null);
      this.notify.showWarning('Could not load the catalogue summary.');
    } finally {
      this.productLoading.set(false);
    }
  }

  get periodLabels(): string[] {
    return this.orderPoints().map((point) => formatPeriodLabel(point.period));
  }

  get paymentPeriodLabels(): string[] {
    return this.paymentPoints().map((point) => formatPeriodLabel(point.period));
  }

  get grossSalesSeries(): LineSeries[] {
    return [
      {
        name: 'Gross sales',
        color: CHART_COLORS.primary,
        values: this.orderPoints().map((point) => point.grossSales),
      },
    ];
  }

  get orderSeries(): LineSeries[] {
    const points = this.orderPoints();
    return [
      { name: 'Orders', color: CHART_COLORS.violet, values: points.map((p) => p.orders) },
      { name: 'Confirmed', color: CHART_COLORS.success, values: points.map((p) => p.confirmedOrders) },
    ];
  }

  get paymentSeries(): LineSeries[] {
    const points = this.paymentPoints();
    return [
      { name: 'Successful', color: CHART_COLORS.success, values: points.map((p) => p.success) },
      { name: 'Failed', color: CHART_COLORS.error, values: points.map((p) => p.failed) },
    ];
  }

  get orderStatusSegments(): DonutSegment[] {
    const summary = this.orderSummary();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Confirmed', value: summary.confirmedOrders, color: CHART_COLORS.success },
      { label: 'Pending payment', value: summary.pendingPaymentOrders, color: CHART_COLORS.warning },
      { label: 'Cancelled', value: summary.cancelledOrders, color: CHART_COLORS.error },
    ];
  }

  get paymentStatusSegments(): DonutSegment[] {
    const summary = this.paymentSummary();
    if (!summary) {
      return [];
    }
    return [
      { label: 'Success', value: summary.success, color: CHART_COLORS.success },
      { label: 'Failed', value: summary.failed, color: CHART_COLORS.error },
      { label: 'Refunded', value: summary.refunded, color: CHART_COLORS.cyan },
      { label: 'Refund pending', value: summary.refundPending, color: CHART_COLORS.warning },
      { label: 'Processing', value: summary.processing, color: CHART_COLORS.primary },
      { label: 'Initiated', value: summary.initiated, color: CHART_COLORS.neutral },
    ];
  }

  get topProductBars(): BarItem[] {
    return this.topProducts().map((product) => ({
      label: product.productName,
      value: product.revenue,
    }));
  }

  get totalOrdersLabel(): string {
    return String(this.orderSummary()?.totalOrders ?? 0);
  }

  get paymentTotalLabel(): string {
    return String(this.paymentSummary()?.totalPayments ?? 0);
  }
}
