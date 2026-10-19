import { Component, Input } from '@angular/core';
import { CHART_COLORS } from '../../../core/utils/chart-palette';

export interface LineSeries {
  name: string;
  color: string;
  values: number[];
}

interface GridTick {
  value: number;
  y: number;
  label: string;
}

interface XLabel {
  index: number;
  x: number;
  label: string;
}

interface Dot {
  index: number;
  cx: number;
  cy: number;
}

const VIEW_WIDTH = 680;
const PAD_LEFT = 58;
const PAD_RIGHT = 20;
const PAD_TOP = 18;
const PAD_BOTTOM = 34;
const MAX_X_LABELS = 6;

const niceCeil = (value: number): number => {
  if (value <= 0) {
    return 1;
  }
  const exponent = Math.floor(Math.log10(value));
  const base = Math.pow(10, exponent);
  const fraction = value / base;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * base;
};

/**
 * Dependency-free multi-series line chart rendered with inline SVG. Handles an
 * empty dataset by showing a muted placeholder rather than a broken axis.
 */
@Component({
  selector: 'app-line-chart',
  standalone: true,
  template: `
    <figure class="chart">
      @if (!hasData()) {
        <p class="chart__empty">{{ emptyMessage }}</p>
      } @else {
        <svg
          class="chart__svg"
          [attr.viewBox]="viewBox"
          role="img"
          [attr.aria-label]="ariaLabel"
          preserveAspectRatio="xMidYMid meet"
        >
          @for (tick of gridTicks(); track tick.value) {
            <line
              class="chart__grid"
              [attr.x1]="plotLeft"
              [attr.x2]="plotRight"
              [attr.y1]="tick.y"
              [attr.y2]="tick.y"
            />
            <text
              class="chart__axis-text"
              [attr.x]="plotLeft - 10"
              [attr.y]="tick.y + 4"
              text-anchor="end"
            >
              {{ tick.label }}
            </text>
          }

          @for (label of xLabels(); track label.index) {
            <text
              class="chart__axis-text"
              [attr.x]="label.x"
              [attr.y]="height - 10"
              text-anchor="middle"
            >
              {{ label.label }}
            </text>
          }

          @for (series of series; track series.name) {
            <polyline
              class="chart__line"
              [attr.points]="polylinePoints(series)"
              [attr.stroke]="series.color"
              fill="none"
            />
            @if (showDots()) {
              @for (dot of dotsFor(series); track dot.index) {
                <circle [attr.cx]="dot.cx" [attr.cy]="dot.cy" r="2.6" [attr.fill]="series.color" />
              }
            }
          }
        </svg>
      }

      @if (hasData() && series.length) {
        <figcaption class="chart__legend">
          @for (series of series; track series.name) {
            <span class="chart__legend-item">
              <span class="chart__swatch" [style.background]="series.color"></span>
              {{ series.name }}
            </span>
          }
        </figcaption>
      }
    </figure>
  `,
})
export class LineChart {
  @Input() labels: string[] = [];
  @Input() series: LineSeries[] = [];
  @Input() height = 260;
  @Input() ariaLabel = 'Line chart';
  @Input() emptyMessage = 'No data for the selected period.';
  @Input() showLegend = true;
  @Input() formatValue: (value: number) => string = (value) =>
    new Intl.NumberFormat('en-IN').format(value);

  readonly gridColor = CHART_COLORS.grid;

  get viewBox(): string {
    return `0 0 ${VIEW_WIDTH} ${this.height}`;
  }

  get plotLeft(): number {
    return PAD_LEFT;
  }

  get plotRight(): number {
    return VIEW_WIDTH - PAD_RIGHT;
  }

  private get plotTop(): number {
    return PAD_TOP;
  }

  private get plotBottom(): number {
    return this.height - PAD_BOTTOM;
  }

  private get plotWidth(): number {
    return this.plotRight - this.plotLeft;
  }

  private get plotHeight(): number {
    return this.plotBottom - this.plotTop;
  }

  hasData(): boolean {
    return this.labels.length > 0 && this.series.some((s) => s.values.length > 0);
  }

  showDots(): boolean {
    return this.labels.length > 1 && this.labels.length <= 40;
  }

  private maxValue(): number {
    let max = 0;
    for (const series of this.series) {
      for (const value of series.values) {
        if (Number.isFinite(value) && value > max) {
          max = value;
        }
      }
    }
    return max;
  }

  private scaleMax(): number {
    return niceCeil(this.maxValue() || 1);
  }

  gridTicks(): GridTick[] {
    const max = this.scaleMax();
    const divisions = 4;
    const ticks: GridTick[] = [];

    for (let i = 0; i <= divisions; i += 1) {
      const value = (max / divisions) * i;
      ticks.push({
        value,
        y: this.plotBottom - (value / max) * this.plotHeight,
        label: this.formatValue(value),
      });
    }

    return ticks;
  }

  private xFor(index: number): number {
    const count = this.labels.length;
    if (count <= 1) {
      return this.plotLeft + this.plotWidth / 2;
    }
    return this.plotLeft + (index / (count - 1)) * this.plotWidth;
  }

  private yFor(value: number): number {
    const max = this.scaleMax();
    return this.plotBottom - (value / max) * this.plotHeight;
  }

  xLabels(): XLabel[] {
    const count = this.labels.length;
    if (count === 0) {
      return [];
    }

    const step = Math.max(1, Math.ceil(count / MAX_X_LABELS));
    const result: XLabel[] = [];

    for (let i = 0; i < count; i += step) {
      result.push({ index: i, x: this.xFor(i), label: this.labels[i] });
    }

    const lastIndex = count - 1;
    if (result[result.length - 1]?.index !== lastIndex && count > 1) {
      result.push({ index: lastIndex, x: this.xFor(lastIndex), label: this.labels[lastIndex] });
    }

    return result;
  }

  polylinePoints(series: LineSeries): string {
    return series.values
      .map((value, index) => `${this.xFor(index).toFixed(1)},${this.yFor(value).toFixed(1)}`)
      .join(' ');
  }

  dotsFor(series: LineSeries): Dot[] {
    return series.values.map((value, index) => ({
      index,
      cx: this.xFor(index),
      cy: this.yFor(value),
    }));
  }
}
