import { Component, Input } from '@angular/core';
import { CHART_COLORS } from '../../../core/utils/chart-palette';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutSegmentView extends DonutSegment {
  dash: string;
  offset: string;
  percentLabel: string;
}

const RADIUS = 78;
const STROKE = 26;

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  template: `
    <figure class="chart chart--donut">
      @if (!hasData()) {
        <p class="chart__empty">{{ emptyMessage }}</p>
      } @else {
        <div class="chart__donut">
          <svg viewBox="0 0 220 220" role="img" [attr.aria-label]="ariaLabel">
            <circle
              cx="110"
              cy="110"
              [attr.r]="radius"
              fill="none"
              [attr.stroke]="trackColor"
              [attr.stroke-width]="stroke"
            />
            @for (segment of segmentViews(); track segment.label) {
              <circle
                cx="110"
                cy="110"
                [attr.r]="radius"
                fill="none"
                [attr.stroke]="segment.color"
                [attr.stroke-width]="stroke"
                pathLength="100"
                [attr.stroke-dasharray]="segment.dash"
                [attr.stroke-dashoffset]="segment.offset"
                transform="rotate(-90 110 110)"
              />
            }
            <text x="110" y="106" text-anchor="middle" class="chart__donut-value">
              {{ centerValue }}
            </text>
            <text x="110" y="128" text-anchor="middle" class="chart__axis-text">
              {{ centerLabel }}
            </text>
          </svg>
        </div>

        <figcaption class="chart__legend chart__legend--stacked">
          @for (segment of segmentViews(); track segment.label) {
            <span class="chart__legend-item">
              <span class="chart__swatch" [style.background]="segment.color"></span>
              <span class="chart__legend-label">{{ segment.label }}</span>
              <span class="chart__legend-value">{{ segment.value }} · {{ segment.percentLabel }}</span>
            </span>
          }
        </figcaption>
      }
    </figure>
  `,
})
export class DonutChart {
  @Input() segments: DonutSegment[] = [];
  @Input() centerValue = '';
  @Input() centerLabel = '';
  @Input() ariaLabel = 'Donut chart';
  @Input() emptyMessage = 'No data for the selected period.';

  readonly radius = RADIUS;
  readonly stroke = STROKE;
  readonly trackColor = CHART_COLORS.grid;

  hasData(): boolean {
    return this.total() > 0;
  }

  private total(): number {
    return this.segments.reduce((acc, segment) => acc + Math.max(0, segment.value), 0);
  }

  segmentViews(): DonutSegmentView[] {
    const total = this.total();
    if (total <= 0) {
      return [];
    }

    let cumulative = 0;

    return this.segments
      .filter((segment) => segment.value > 0)
      .map((segment) => {
        const percent = (segment.value / total) * 100;
        const offset = -cumulative;
        cumulative += percent;

        return {
          ...segment,
          dash: `${percent} ${100 - percent}`,
          offset: String(offset),
          percentLabel: `${percent.toFixed(0)}%`,
        };
      });
  }
}
