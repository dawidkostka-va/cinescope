import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Button from '@mui/material/Button';
import dayjs, { Dayjs } from 'dayjs';
import { addDaysIso, todayIso, weekdayFull } from '../../utils/date';

interface Props {
  selectedDate: string;
  onSelect: (date: string) => void;
}

export function DayPicker({ selectedDate, onSelect }: Props) {
  const today = todayIso();
  const days = Array.from({ length: 5 }, (_, i) => addDaysIso(today, i));
  const isPreset = days.includes(selectedDate);
  const datePickerValue: Dayjs | null = isPreset ? null : dayjs(selectedDate);

  function handleDatePickerChange(value: Dayjs | null) {
    if (value && value.isValid()) {
      onSelect(value.format('YYYY-MM-DD'));
    }
  }

  return (
    <div className="day-picker" data-testid="day-picker">
      {days.map((date, index) => (
        <Button
          key={date}
          data-testid="day-button"
          data-date={date}
          data-selected={selectedDate === date ? 'true' : 'false'}
          variant={selectedDate === date ? 'contained' : 'outlined'}
          onClick={() => onSelect(date)}
        >
          {index === 0 ? 'Today' : weekdayFull(date)}
        </Button>
      ))}
      <DatePicker
        label="Choose a date"
        value={datePickerValue}
        minDate={dayjs(today)}
        onChange={handleDatePickerChange}
        slotProps={{ textField: { inputProps: { 'data-testid': 'date-picker' } } }}
      />
    </div>
  );
}

export default DayPicker;
