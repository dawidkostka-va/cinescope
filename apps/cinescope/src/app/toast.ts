import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

const TOAST_DURATION_MS = 4000;

@Component({
  selector: 'app-toast',
  template: `<div data-testid="toast">{{ message }}</div>`,
})
export class Toast {
  readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);
  private timer?: ReturnType<typeof setTimeout>;

  show(message: string): void {
    clearTimeout(this.timer);
    const ref = this.snackBar.openFromComponent(Toast, { data: message, duration: 0 });
    this.timer = setTimeout(() => ref.dismiss(), TOAST_DURATION_MS);
  }
}
