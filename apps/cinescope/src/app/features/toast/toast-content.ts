import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toast-content',
  template: `<span data-testid="toast">{{ message }}</span>`,
})
export class ToastContent {
  private readonly data = inject<{ message: string }>(MAT_SNACK_BAR_DATA);
  readonly message = this.data.message;
}
