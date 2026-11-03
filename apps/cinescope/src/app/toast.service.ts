import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toast',
  template: `<span data-testid="toast">{{ data.message }}</span>`,
})
export class Toast {
  protected readonly data = inject<{ message: string }>(MAT_SNACK_BAR_DATA);
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent(Toast, { data: { message }, duration: 4000 });
  }
}
