import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookingStore } from '../../core/booking';

@Component({
  selector: 'app-confirmation',
  imports: [MatButton],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly router = inject(Router);
  private readonly store = inject(BookingStore);

  protected readonly email = this.store.booking()?.email ?? '';

  protected done(): void {
    this.store.clear();
    void this.router.navigateByUrl('/');
  }
}
