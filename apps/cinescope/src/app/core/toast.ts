import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

export const TOAST_DURATION_MS = 4000;

@Component({
  selector: 'app-toast',
  template: `<div data-testid="toast">{{ message }}</div>`,
})
export class ToastComponent {
  readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent(ToastComponent, {
      data: message,
      duration: TOAST_DURATION_MS,
    });
  }
}
