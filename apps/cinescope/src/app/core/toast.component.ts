import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toast',
  template: `{{ message }}`,
  host: { 'data-testid': 'toast' },
})
export class ToastComponent {
  readonly message: string = inject(MAT_SNACK_BAR_DATA);
}
