import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toast',
  template: '{{ message }}',
  host: { 'data-testid': 'toast' },
})
export class Toast {
  protected readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}
