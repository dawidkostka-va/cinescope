import { Component, Injectable, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toast',
  template: '{{ message }}',
  host: { 'data-testid': 'toast' },
})
export class ToastComponent {
  readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent(ToastComponent, { data: message, duration: 4000 });
  }
}
