import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

/** How long a toast stays visible, in milliseconds. */
export const TOAST_DURATION_MS = 4000;

/** Content of a toast; carries the `toast` identifier. */
@Component({
  selector: 'app-toast-message',
  template: `<span data-testid="toast">{{ message }}</span>`,
})
export class ToastMessage {
  protected readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}

/** Shows short messages as toasts. Only one is visible at a time: a new toast replaces the current one. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent(ToastMessage, { data: message, duration: TOAST_DURATION_MS });
  }
}
