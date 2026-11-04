import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div data-testid="toast">{{ message }}</div>`,
})
export class ToastComponent {
  protected readonly message = inject<string>(MAT_SNACK_BAR_DATA);
}
