import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHost } from './shared/components/toast-host/toast-host';
import { ConfirmDialog } from './shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastHost, ConfirmDialog],
  template: `
    <a class="skip-link" href="#main-content">Skip to content</a>
    <router-outlet></router-outlet>
    <app-toast-host></app-toast-host>
    <app-confirm-dialog></app-confirm-dialog>
  `,
})
export class App {}
