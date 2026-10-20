import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Toast, ToastData } from '../shared/toast/toast';

const DURATION_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.openFromComponent<Toast, ToastData>(Toast, {
      data: { message },
      duration: DURATION_MS,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
