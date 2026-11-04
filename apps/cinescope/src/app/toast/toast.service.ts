import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Toast } from './toast';

const TOAST_DURATION_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent(Toast, {
      data: message,
      duration: TOAST_DURATION_MS,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
