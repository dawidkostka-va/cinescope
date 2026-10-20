import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDaysIso, todayISO, weekdayFull } from '../../utils/date';

interface DayPickerProps {
  selectedDate: string;
  onSelect: (date: string) => void;
}

export function DayPicker({ selectedDate, onSelect }: DayPickerProps) {
  const today = todayISO();
  const days = Array.from({ length: 5 }, (_, i) => addDaysIso(today, i));

  const datePickerValue: Dayjs = dayjs(selectedDate);

  return (
    <Box data-testid="day-picker" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
      {days.map((date, index) => {
        const isSelected = date === selectedDate;
        return (
          <Button
            key={date}
            data-testid="day-button"
            data-date={date}
            data-selected={isSelected ? 'true' : 'false'}
            variant={isSelected ? 'contained' : 'outlined'}
            onClick={() => onSelect(date)}
          >
            {index === 0 ? 'Today' : weekdayFull(date)}
          </Button>
        );
      })}
      <DatePicker
        value={datePickerValue}
        minDate={dayjs(today)}
        onChange={(value) => {
          if (value && value.isValid()) {
            onSelect(value.format('YYYY-MM-DD'));
          }
        }}
        slotProps={{ textField: { 'data-testid': 'date-picker', size: 'small' } as object }}
      />
    </Box>
  );
}
