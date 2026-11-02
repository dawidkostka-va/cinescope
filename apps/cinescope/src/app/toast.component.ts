import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toast',
  template: `<span data-testid="toast">{{ data.message }}</span>`,
})
export class ToastComponent {
  readonly data = inject<{ message: string }>(MAT_SNACK_BAR_DATA);
}
