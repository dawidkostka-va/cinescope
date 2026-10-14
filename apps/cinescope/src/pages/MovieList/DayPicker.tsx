import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { ISO_FORMAT, nextDays, weekdayFull } from '../../lib/dates';

const QUICK_DAY_COUNT = 5;

interface DayPickerProps {
  selectedDate: string;
  onSelect: (iso: string) => void;
}

export function DayPicker({ selectedDate, onSelect }: DayPickerProps) {
  const days = nextDays(QUICK_DAY_COUNT);
  const isQuickDay = days.includes(selectedDate);

  return (
    <Box data-testid="day-picker" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
      {days.map((date, index) => {
        const selected = date === selectedDate;
        const label = index === 0 ? 'Today' : weekdayFull(date);
        return (
          <Button
            key={date}
            data-testid="day-button"
            data-date={date}
            data-selected={selected ? 'true' : 'false'}
            variant={selected ? 'contained' : 'outlined'}
            onClick={() => onSelect(date)}
          >
            {label}
          </Button>
        );
      })}
      <DatePicker
        disablePast
        value={isQuickDay ? null : dayjs(selectedDate, ISO_FORMAT)}
        onChange={(value: Dayjs | null) => {
          if (value && value.isValid()) {
            onSelect(value.format(ISO_FORMAT));
          }
        }}
        slotProps={{ textField: { 'data-testid': 'date-picker', size: 'small' } as object }}
      />
    </Box>
  );
}
