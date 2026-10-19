import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../config/app-config';
import type { ApiSuccess } from '../models/api';
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
} from '../models/analytics';

/**
 * Read-only client for the administrator-only reporting endpoints exposed by
 * the order, payment, customer and product services. The API gateway restricts
 * these routes to the ADMIN role.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getOrderSummary(range: ReportRange): Observable<OrderReportSummary> {
    return this.http
      .get<ApiSuccess<OrderReportSummary>>(`${this.baseUrl}/api/v1/orders/reports/summary`, {
        params: this.rangeParams(range),
      })
      .pipe(map((res) => res.data));
  }

  getOrderTimeseries(
    range: ReportRange,
    bucket: ReportBucket = 'day',
  ): Observable<OrderReportTimeseries> {
    return this.http
      .get<ApiSuccess<OrderReportTimeseries>>(
        `${this.baseUrl}/api/v1/orders/reports/timeseries`,
        { params: this.rangeParams(range).set('bucket', bucket) },
      )
      .pipe(map((res) => res.data));
  }

  getTopProducts(range: ReportRange, limit = 10): Observable<OrderTopProducts> {
    return this.http
      .get<ApiSuccess<OrderTopProducts>>(`${this.baseUrl}/api/v1/orders/reports/top-products`, {
        params: this.rangeParams(range).set('limit', String(limit)),
      })
      .pipe(map((res) => res.data));
  }

  getPaymentSummary(range: ReportRange): Observable<PaymentReportSummary> {
    return this.http
      .get<ApiSuccess<PaymentReportSummary>>(`${this.baseUrl}/api/v1/payments/reports/summary`, {
        params: this.rangeParams(range),
      })
      .pipe(map((res) => res.data));
  }

  getPaymentTimeseries(
    range: ReportRange,
    bucket: ReportBucket = 'day',
  ): Observable<PaymentReportTimeseries> {
    return this.http
      .get<ApiSuccess<PaymentReportTimeseries>>(
        `${this.baseUrl}/api/v1/payments/reports/timeseries`,
        { params: this.rangeParams(range).set('bucket', bucket) },
      )
      .pipe(map((res) => res.data));
  }

  getCustomerSummary(range: ReportRange): Observable<CustomerReportSummary> {
    return this.http
      .get<ApiSuccess<CustomerReportSummary>>(`${this.baseUrl}/api/v1/customers/reports/summary`, {
        params: this.rangeParams(range),
      })
      .pipe(map((res) => res.data));
  }

  getProductSummary(lowStockThreshold = 10): Observable<ProductReportSummary> {
    return this.http
      .get<ApiSuccess<ProductReportSummary>>(`${this.baseUrl}/api/v1/products/reports/summary`, {
        params: new HttpParams().set('lowStockThreshold', String(lowStockThreshold)),
      })
      .pipe(map((res) => res.data));
  }

  private rangeParams(range: ReportRange): HttpParams {
    return new HttpParams().set('from', range.from).set('to', range.to);
  }
}
