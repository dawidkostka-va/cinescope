import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

export interface ToastData {
  message: string;
}

@Component({
  selector: 'app-toast',
  template: `{{ data.message }}`,
  host: { 'data-testid': 'toast' },
})
export class ToastComponent {
  protected readonly data = inject<ToastData>(MAT_SNACK_BAR_DATA);
}
