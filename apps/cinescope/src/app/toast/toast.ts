import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

const TOAST_DURATION_MS = 4000;

@Component({
  selector: 'app-toast',
  template: `<div data-testid="toast">{{ message }}</div>`,
})
export class ToastMessage {
  readonly message: string = inject(MAT_SNACK_BAR_DATA);
}

@Injectable({ providedIn: 'root' })
export class Toaster {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent(ToastMessage, { data: message, duration: TOAST_DURATION_MS });
  }
}
