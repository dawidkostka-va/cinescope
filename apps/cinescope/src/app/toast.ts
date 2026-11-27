import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

/** How long a toast stays visible (section 3.2). */
const TOAST_DURATION_MS = 4000;

/** Content of a toast; carries the `toast` identifier (section 9.6). */
@Component({
  selector: 'app-toast',
  template: '<span data-testid="toast">{{ message }}</span>',
})
export class ToastContent {
  protected readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}

/** Shows short messages as toasts; a new toast replaces the one on screen (section 3.2). */
@Injectable({ providedIn: 'root' })
export class Toast {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent(ToastContent, { data: message, duration: TOAST_DURATION_MS });
  }
}
