import { useMemo } from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { nextDays, todayISO, weekdayFull } from '../utils/dates';

interface DayPickerProps {
  selectedDate: string;
  onSelect: (date: string) => void;
}

export function DayPicker({ selectedDate, onSelect }: DayPickerProps) {
  const today = todayISO();
  const days = useMemo(() => [today, ...nextDays(today, 4)], [today]);

  return (
    <Stack
      data-testid="day-picker"
      direction="row"
      spacing={1}
      sx={{ mb: 3, alignItems: 'center', flexWrap: 'wrap' }}
    >
      {days.map((date, index) => (
        <Button
          key={date}
          data-testid="day-button"
          data-date={date}
          data-selected={date === selectedDate}
          variant={date === selectedDate ? 'contained' : 'outlined'}
          onClick={() => onSelect(date)}
        >
          {index === 0 ? 'Today' : weekdayFull(date)}
        </Button>
      ))}
      <DatePicker
        value={dayjs(selectedDate)}
        minDate={dayjs(today)}
        onChange={(value: Dayjs | null) => {
          if (value && value.isValid()) {
            onSelect(value.format('YYYY-MM-DD'));
          }
        }}
        slotProps={{ textField: { slotProps: { htmlInput: { 'data-testid': 'date-picker' } } } }}
      />
    </Stack>
  );
}
