import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toast',
  template: `<div data-testid="toast">{{ message }}</div>`,
})
export class Toast {
  protected readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);
  private ref?: MatSnackBarRef<Toast>;
  private next?: string;

  show(message: string): void {
    if (this.ref) {
      this.next = message;
      this.ref.dismiss();
    } else {
      this.open(message);
    }
  }

  private open(message: string): void {
    const ref = this.snackBar.openFromComponent(Toast, {
      data: message,
      duration: 4000,
      verticalPosition: 'top',
    });
    this.ref = ref;
    ref.afterDismissed().subscribe(() => {
      this.ref = undefined;
      if (this.next !== undefined) {
        const queued = this.next;
        this.next = undefined;
        this.open(queued);
      }
    });
  }
}
