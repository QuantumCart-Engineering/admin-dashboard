import { Component, inject } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (state(); as s) {
      <div class="modal-backdrop" (click)="service.dismiss()">
        <div
          class="modal"
          role="alertdialog"
          aria-modal="true"
          [attr.aria-label]="s.title"
          (click)="$event.stopPropagation()"
        >
          <h2>{{ s.title }}</h2>
          <p>{{ s.message }}</p>
          <div class="modal__actions">
            <button class="btn ghost" type="button" (click)="service.dismiss()">
              {{ s.cancelLabel || 'Cancel' }}
            </button>
            <button
              class="btn"
              [class.danger]="s.danger"
              type="button"
              autofocus
              (click)="service.accept()"
            >
              {{ s.confirmLabel || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly service = inject(ConfirmDialogService);
  readonly state = this.service.state;
}
