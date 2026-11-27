import { Component, inject, Injectable } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

/** How long a toast stays visible, in milliseconds. */
const TOAST_DURATION_MS = 4000;

@Component({
  selector: 'app-toast',
  template: `{{ message }}`,
  host: { 'data-testid': 'toast' },
})
export class ToastMessage {
  protected readonly message = inject<{ message: string }>(MAT_SNACK_BAR_DATA).message;
}

/** Shows short messages as toasts; a new toast replaces the one on screen. */
@Injectable({ providedIn: 'root' })
export class Toast {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.dismiss();
    this.snackBar.openFromComponent(ToastMessage, {
      data: { message },
      duration: TOAST_DURATION_MS,
    });
  }
}
