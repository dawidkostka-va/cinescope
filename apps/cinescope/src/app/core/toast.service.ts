import { Component, inject, Injectable } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toast',
  template: `<span data-testid="toast">{{ message }}</span>`,
})
export class ToastComponent {
  protected readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);
  private current: MatSnackBarRef<ToastComponent> | null = null;
  private pending: string | null = null;

  show(message: string) {
    this.pending = message;
    if (this.current) this.current.dismiss();
    else this.open();
  }

  private open() {
    const message = this.pending;
    if (message === null) return;
    this.pending = null;
    const ref = this.snackBar.openFromComponent(ToastComponent, { data: message, duration: 4000 });
    this.current = ref;
    ref.afterDismissed().subscribe(() => {
      if (this.current !== ref) return;
      this.current = null;
      this.open();
    });
  }
}
