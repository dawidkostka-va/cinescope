import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { ToastComponent } from '../shared/toast/toast.component';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);
  private ref: MatSnackBarRef<ToastComponent> | null = null;

  show(message: string): void {
    this.ref?.dismiss();
    this.ref = this.snackBar.openFromComponent(ToastComponent, {
      data: { message },
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
