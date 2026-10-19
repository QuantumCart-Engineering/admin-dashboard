import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <div class="state is-error surface fade-in" role="alert">
      <div class="state__icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3.5 21 20H3l9-16.5Z"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
          <path d="M12 10v4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <circle cx="12" cy="17.2" r="1" fill="currentColor" />
        </svg>
      </div>
      <h2>{{ title }}</h2>
      @if (message) {
        <p>{{ message }}</p>
      }
      <button class="btn ghost" type="button" (click)="retry.emit()">Try again</button>
    </div>
  `,
})
export class ErrorState {
  @Input() title = 'Something went wrong';
  @Input() message = 'We could not load this data. Please try again.';
  @Output() retry = new EventEmitter<void>();
}
