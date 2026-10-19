import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DateRangeValue, RangePreset, isValidIsoDate, presetRange } from '../../../core/utils/report-range';

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: 'mtd', label: 'MTD' },
];

@Component({
  selector: 'app-range-bar',
  standalone: true,
  template: `
    <div class="range-bar">
      <div class="segmented" role="group" aria-label="Date range presets">
        @for (preset of presets; track preset.id) {
          <button
            type="button"
            [class.active]="activePreset === preset.id"
            (click)="applyPreset(preset.id)"
          >
            {{ preset.label }}
          </button>
        }
      </div>

      <div class="range-bar__fields">
        <label class="sr-only" for="range-from">From date</label>
        <input
          id="range-from"
          class="input"
          type="date"
          [value]="draftFrom"
          (input)="onFrom($event)"
        />
        <span class="range-bar__sep" aria-hidden="true">→</span>
        <label class="sr-only" for="range-to">To date</label>
        <input
          id="range-to"
          class="input"
          type="date"
          [value]="draftTo"
          (input)="onTo($event)"
        />
      </div>

      <button class="btn ghost small" type="button" (click)="applyCustom()">Apply</button>
    </div>
  `,
})
export class RangeBar {
  @Input() set value(next: DateRangeValue) {
    this.draftFrom = next.from;
    this.draftTo = next.to;
    this.activePreset = null;
  }

  @Output() valueChange = new EventEmitter<DateRangeValue>();

  readonly presets = PRESETS;

  draftFrom = '';
  draftTo = '';
  activePreset: RangePreset | null = null;

  applyPreset(preset: RangePreset) {
    this.activePreset = preset;
    const range = presetRange(preset);
    this.draftFrom = range.from;
    this.draftTo = range.to;
    this.valueChange.emit(range);
  }

  onFrom(event: Event) {
    this.activePreset = null;
    this.draftFrom = (event.target as HTMLInputElement).value;
  }

  onTo(event: Event) {
    this.activePreset = null;
    this.draftTo = (event.target as HTMLInputElement).value;
  }

  applyCustom() {
    if (!this.draftFrom || !this.draftTo) {
      return;
    }
    if (!isValidIsoDate(this.draftFrom) || !isValidIsoDate(this.draftTo)) {
      return;
    }
    this.activePreset = 'custom';
    this.valueChange.emit({ from: this.draftFrom, to: this.draftTo });
  }
}
