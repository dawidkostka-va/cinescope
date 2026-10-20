import { Dayjs } from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { toISODate, today } from '../../dateUtils';

interface DayPickerProps {
  selectedDate: Dayjs;
  onSelectDate: (date: Dayjs) => void;
}

export function DayPicker({ selectedDate, onSelectDate }: DayPickerProps) {
  const todayDate = today();
  const quickDays = Array.from({ length: 5 }, (_, i) => todayDate.add(i, 'day'));
  const selectedISO = toISODate(selectedDate);

  return (
    <Box
      data-testid="day-picker"
      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}
    >
      {quickDays.map((day, index) => {
        const iso = toISODate(day);
        const label = index === 0 ? 'Today' : day.format('dddd');
        return (
          <Button
            key={iso}
            data-testid="day-button"
            data-date={iso}
            data-selected={iso === selectedISO ? 'true' : 'false'}
            variant={iso === selectedISO ? 'contained' : 'outlined'}
            onClick={() => onSelectDate(day)}
          >
            {label}
          </Button>
        );
      })}
      <Box data-testid="date-picker">
        <DatePicker
          value={selectedDate}
          minDate={todayDate}
          onChange={(value) => {
            if (value && value.isValid()) {
              onSelectDate(value);
            }
          }}
        />
      </Box>
    </Box>
  );
}
