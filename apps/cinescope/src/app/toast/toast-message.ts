import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toast-message',
  template: '<div data-testid="toast">{{ message }}</div>',
})
export class ToastMessage {
  protected readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}
