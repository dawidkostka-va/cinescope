import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

/** How long a toast stays visible, in milliseconds (section 3.2). */
const TOAST_DURATION_MS = 4000;

export interface ToastData {
  message: string;
}

/** The content of a toast; its host element carries the `toast` identifier (section 9.6). */
@Component({
  selector: 'app-toast',
  template: '{{ data.message }}',
  host: { 'data-testid': 'toast' },
})
export class ToastMessage {
  readonly data = inject<ToastData>(MAT_SNACK_BAR_DATA);
}

/** Shows short messages as toasts. Opening a toast replaces the one that is visible. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent(ToastMessage, {
      data: { message } satisfies ToastData,
      duration: TOAST_DURATION_MS,
    });
  }
}
