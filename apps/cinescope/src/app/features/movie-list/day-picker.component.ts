import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { addDays, formatIso, parseIso, startOfToday, weekdayName } from '../../core/utils/date.util';

interface DayOption {
  iso: string;
  label: string;
}

@Component({
  selector: 'app-day-picker',
  imports: [MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './day-picker.component.html',
  styleUrl: './day-picker.component.scss',
})
export class DayPickerComponent {
  readonly selectedDate = input.required<string>();
  readonly dateSelected = output<string>();

  private readonly today = startOfToday();
  readonly minDate = this.today;

  readonly days: DayOption[] = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(this.today, i);
    return { iso: formatIso(date), label: i === 0 ? 'Today' : weekdayName(date) };
  });

  readonly isDayButtonSelected = (iso: string) => this.selectedDate() === iso;

  readonly datepickerValue = computed(() => {
    const iso = this.selectedDate();
    return this.days.some((d) => d.iso === iso) ? null : parseIso(iso);
  });

  selectDay(iso: string): void {
    this.dateSelected.emit(iso);
  }

  onDatepickerChange(date: Date | null): void {
    if (date) {
      this.dateSelected.emit(formatIso(date));
    }
  }
}
