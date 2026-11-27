import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

/** How long a toast stays visible, in milliseconds. */
const TOAST_DURATION_MS = 4000;

/** Content of a toast. The element with `data-testid="toast"` holds the message text. */
@Component({
  selector: 'app-toast',
  template: `<span data-testid="toast">{{ message }}</span>`,
})
class ToastMessage {
  protected readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}

/** Shows short messages. MatSnackBar keeps one toast at a time: a new toast replaces the current one. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent(ToastMessage, { data: message, duration: TOAST_DURATION_MS });
  }
}
