import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

export const TOAST_DURATION_MS = 4000;

/** Content of the toast: a snack bar showing one message. */
@Component({
  selector: 'app-toast',
  template: `<span data-testid="toast">{{ message }}</span>`,
})
export class ToastContent {
  readonly message = inject<{ message: string }>(MAT_SNACK_BAR_DATA).message;
}

/** Shows short messages. A new message replaces the one on screen. */
@Injectable({ providedIn: 'root' })
export class Toast {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent(ToastContent, {
      data: { message },
      duration: TOAST_DURATION_MS,
    });
  }
}
