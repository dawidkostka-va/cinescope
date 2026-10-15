import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { addDays, formatIso, parseIso, todayIso, weekdayFull } from '../../core/date-utils';

interface DayButton {
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
  readonly selected = input.required<string>();
  readonly dateSelected = output<string>();

  protected readonly minDate = parseIso(todayIso());

  protected readonly dayButtons: DayButton[] = (() => {
    const today = todayIso();
    const buttons: DayButton[] = [{ iso: today, label: 'Today' }];
    for (let i = 1; i <= 4; i++) {
      const iso = addDays(today, i);
      buttons.push({ iso, label: weekdayFull(iso) });
    }
    return buttons;
  })();

  protected readonly selectedDate = computed(() => parseIso(this.selected()));

  protected onDateChange(event: MatDatepickerInputEvent<Date>): void {
    if (event.value) {
      this.dateSelected.emit(formatIso(event.value));
    }
  }
}
