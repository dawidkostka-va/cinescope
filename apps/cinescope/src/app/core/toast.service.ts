import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarLabel } from '@angular/material/snack-bar';

@Component({
  imports: [MatSnackBarLabel],
  host: { 'data-testid': 'toast' },
  template: `<span matSnackBarLabel>{{ message }}</span>`,
})
export class ToastMessage {
  readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent(ToastMessage, { data: message, duration: 4000 });
  }
}
