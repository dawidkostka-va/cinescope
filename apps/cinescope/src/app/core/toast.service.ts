import { Component, Injectable, computed, inject, signal } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBar } from '@angular/material/snack-bar';

interface ToastData {
  message: string;
  token: number;
}

@Component({
  selector: 'app-toast',
  template: `<span [attr.data-testid]="active() ? 'toast' : null">{{ data.message }}</span>`,
})
export class ToastComponent {
  protected readonly data = inject<ToastData>(MAT_SNACK_BAR_DATA);
  private readonly service = inject(ToastService);
  protected readonly active = computed(() => this.service.current() === this.data.token);
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);
  private counter = 0;
  readonly current = signal(0);

  show(message: string): void {
    const token = ++this.counter;
    this.current.set(token);
    this.snackBar.openFromComponent(ToastComponent, { data: { message, token }, duration: 4000 });
  }
}
