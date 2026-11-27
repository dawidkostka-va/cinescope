import { Component, inject, Injectable } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

/** Content of a toast: the message text carries the `toast` test id. */
@Component({
  selector: 'app-toast',
  template: `<span data-testid="toast">{{ message }}</span>`,
})
export class ToastMessage {
  protected readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}

/** Shows short messages as toasts. A toast stays for 4 seconds; a new one replaces the current one. */
@Injectable({ providedIn: 'root' })
export class Toaster {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent(ToastMessage, { data: message, duration: 4000 });
  }
}
