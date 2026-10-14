import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { Toast } from '../components/toast';

const TOAST_DURATION_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);
  private current: MatSnackBarRef<Toast> | null = null;

  show(message: string): void {
    this.current?.dismiss();
    this.current = this.snackBar.openFromComponent(Toast, {
      data: message,
      duration: TOAST_DURATION_MS,
    });
  }
}
