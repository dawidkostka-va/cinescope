import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toast',
  template: `<span data-testid="toast">{{ message }}</span>`,
})
export class ToastComponent {
  protected readonly message = inject<{ message: string }>(MAT_SNACK_BAR_DATA).message;
}
