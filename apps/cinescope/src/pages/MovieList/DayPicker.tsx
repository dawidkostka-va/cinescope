import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { dayOptions } from './dayPicker';

interface DayPickerProps {
  selectedDate: string;
  onSelectDate: (iso: string) => void;
}

export function DayPicker({ selectedDate, onSelectDate }: DayPickerProps) {
  const options = dayOptions();
  const isOneOfFive = options.some((option) => option.iso === selectedDate);

  return (
    <div data-testid="day-picker">
      {options.map((option) => (
        <Button
          key={option.iso}
          data-testid="day-button"
          data-date={option.iso}
          data-selected={option.iso === selectedDate ? 'true' : 'false'}
          variant={option.iso === selectedDate ? 'contained' : 'outlined'}
          onClick={() => onSelectDate(option.iso)}
        >
          {option.label}
        </Button>
      ))}
      <DatePicker
        value={isOneOfFive ? null : dayjs(selectedDate)}
        minDate={dayjs().startOf('day')}
        onChange={(value: Dayjs | null) => {
          if (value && value.isValid()) {
            onSelectDate(value.format('YYYY-MM-DD'));
          }
        }}
        slotProps={{ textField: { slotProps: { htmlInput: { 'data-testid': 'date-picker' } } } }}
      />
    </div>
  );
}
