import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { addDays, startOfToday, toIsoDate, weekdayName } from '../../core/date-utils';

@Component({
  selector: 'app-day-picker',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  templateUrl: './day-picker.component.html',
  styleUrl: './day-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayPickerComponent {
  readonly selectedDate = input.required<Date>();
  readonly dateSelected = output<Date>();

  protected readonly today = startOfToday();

  protected readonly quickDays = computed(() => Array.from({ length: 5 }, (_, i) => addDays(this.today, i)));

  protected isoOf(date: Date): string {
    return toIsoDate(date);
  }

  protected isSelected(date: Date): boolean {
    return toIsoDate(date) === toIsoDate(this.selectedDate());
  }

  protected labelFor(date: Date, index: number): string {
    return index === 0 ? 'Today' : weekdayName(date);
  }

  protected onDayClick(date: Date): void {
    this.dateSelected.emit(date);
  }

  protected onDatePicked(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) this.dateSelected.emit(event.value);
  }
}
