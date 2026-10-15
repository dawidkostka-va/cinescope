import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';
import styles from './DayPicker.module.scss';

export interface DayButtonOption {
  value: string;
  label: string;
}

interface DayPickerProps {
  dayButtons: DayButtonOption[];
  selectedButtonValue: string | null;
  datePickerValue: Dayjs | null;
  minDate: Dayjs;
  onSelectDay: (value: string) => void;
  onSelectDate: (value: Dayjs) => void;
}

export function DayPicker({
  dayButtons,
  selectedButtonValue,
  datePickerValue,
  minDate,
  onSelectDay,
  onSelectDate,
}: DayPickerProps) {
  return (
    <div className={styles.container} data-testid="day-picker">
      {dayButtons.map((day) => (
        <Button
          key={day.value}
          data-testid="day-button"
          data-date={day.value}
          data-selected={day.value === selectedButtonValue ? 'true' : 'false'}
          variant={day.value === selectedButtonValue ? 'contained' : 'outlined'}
          onClick={() => onSelectDay(day.value)}
        >
          {day.label}
        </Button>
      ))}
      <div data-testid="date-picker">
        <DatePicker
          value={datePickerValue}
          minDate={minDate}
          onChange={(value) => {
            if (value && value.isValid()) {
              onSelectDate(value);
            }
          }}
          slotProps={{ textField: { size: 'small' } }}
        />
      </div>
    </div>
  );
}
