import { Component, Input } from '@angular/core';
import { CHART_COLORS } from '../../../core/utils/chart-palette';

export interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  valueLabel: string;
  valueY: number;
  labelX: number;
  label: string;
}

const VIEW_WIDTH = 680;
const PAD_LEFT = 58;
const PAD_RIGHT = 20;
const PAD_TOP = 26;
const PAD_BOTTOM = 46;
const MAX_LABEL_LENGTH = 12;

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

@Component({
  selector: 'app-bar-chart',
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

          @for (bar of bars(); track bar.x) {
            <rect
              class="chart__bar"
              [attr.x]="bar.x"
              [attr.y]="bar.y"
              [attr.width]="bar.width"
              [attr.height]="bar.height"
              rx="4"
              [attr.fill]="bar.color"
            />
            <text
              class="chart__bar-value"
              [attr.x]="bar.x + bar.width / 2"
              [attr.y]="bar.valueY"
              text-anchor="middle"
            >
              {{ bar.valueLabel }}
            </text>
            <text
              class="chart__axis-text"
              [attr.x]="bar.labelX"
              [attr.y]="height - 12"
              text-anchor="end"
              [attr.transform]="'rotate(-28 ' + bar.labelX + ' ' + (height - 12) + ')'"
            >
              {{ bar.label }}
            </text>
          }
        </svg>
      }
    </figure>
  `,
})
export class BarChart {
  @Input() items: BarItem[] = [];
  @Input() height = 260;
  @Input() ariaLabel = 'Bar chart';
  @Input() emptyMessage = 'No data for the selected period.';
  @Input() formatValue: (value: number) => string = (value) =>
    new Intl.NumberFormat('en-IN').format(value);
  @Input() defaultColor: string = CHART_COLORS.primary;

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
    return this.items.length > 0;
  }

  private scaleMax(): number {
    const max = this.items.reduce((acc, item) => Math.max(acc, item.value || 0), 0);
    return niceCeil(max || 1);
  }

  gridTicks(): { value: number; y: number; label: string }[] {
    const max = this.scaleMax();
    const divisions = 4;
    const ticks: { value: number; y: number; label: string }[] = [];

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

  bars(): Bar[] {
    const count = this.items.length;
    if (count === 0) {
      return [];
    }

    const max = this.scaleMax();
    const slot = this.plotWidth / count;
    const width = Math.min(slot * 0.6, 64);

    return this.items.map((item, index) => {
      const ratio = Math.max(0, item.value) / max;
      const barHeight = ratio * this.plotHeight;
      const x = this.plotLeft + slot * index + (slot - width) / 2;
      const y = this.plotBottom - barHeight;

      return {
        x,
        y,
        width,
        height: barHeight,
        color: item.color ?? this.defaultColor,
        valueLabel: this.formatValue(item.value),
        valueY: Math.max(y - 6, this.plotTop + 4),
        labelX: x + width / 2,
        label: this.truncate(item.label),
      } satisfies Bar;
    });
  }

  private truncate(label: string): string {
    return label.length > MAX_LABEL_LENGTH ? `${label.slice(0, MAX_LABEL_LENGTH - 1)}…` : label;
  }
}
