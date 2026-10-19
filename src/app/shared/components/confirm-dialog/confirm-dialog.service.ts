import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly _state = signal<ConfirmState | null>(null);
  readonly state = this._state.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this._state.set({ ...options, resolve });
    });
  }

  accept(): void {
    const current = this._state();
    if (current) {
      current.resolve(true);
      this._state.set(null);
    }
  }

  dismiss(): void {
    const current = this._state();
    if (current) {
      current.resolve(false);
      this._state.set(null);
    }
  }
}
