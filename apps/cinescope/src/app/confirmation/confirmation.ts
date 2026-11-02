import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { clearBooking, readBooking } from '../booking';

@Component({
  selector: 'app-confirmation',
  imports: [MatButtonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly router = inject(Router);

  protected readonly email = readBooking()?.paidEmail ?? '';

  protected continue(): void {
    clearBooking();
    void this.router.navigate(['/']);
  }
}
