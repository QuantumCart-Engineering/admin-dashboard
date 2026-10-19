import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="state surface fade-in" role="status">
      <div class="state__icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
          <path d="M4 7.5 12 12l8-4.5M12 12v9" stroke="currentColor" stroke-width="1.6" />
        </svg>
      </div>
      <h2>{{ title }}</h2>
      @if (subtitle) {
        <p>{{ subtitle }}</p>
      }
      @if (actionLabel) {
        <button class="btn" type="button" (click)="action.emit()">{{ actionLabel }}</button>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class EmptyState {
  @Input() title = 'Nothing here yet';
  @Input() subtitle = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
