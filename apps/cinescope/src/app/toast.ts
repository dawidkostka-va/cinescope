import { Component, Injectable, inject, signal } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';

const TOAST_DURATION_MS = 4000;

@Component({
  selector: 'app-toast',
  template: `<div data-testid="toast">{{ toasts.message() }}</div>`,
})
export class ToastComponent {
  readonly toasts = inject(ToastService);
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);
  private ref: MatSnackBarRef<ToastComponent> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly message = signal('');

  show(message: string): void {
    this.message.set(message);
    if (!this.ref) {
      this.ref = this.snackBar.openFromComponent(ToastComponent, { duration: 0 });
    }
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.ref?.dismiss();
      this.ref = null;
    }, TOAST_DURATION_MS);
  }
}
