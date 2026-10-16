import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { addDaysIso, today, weekdayName } from '../../utils/date';

interface DayPickerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function DayPicker({ selectedDate, onSelectDate }: DayPickerProps) {
  const todayIso = today();
  const quickDays = Array.from({ length: 5 }, (_, i) => {
    const iso = addDaysIso(todayIso, i);
    return { iso, label: i === 0 ? 'Today' : weekdayName(iso) };
  });

  const isQuickDate = quickDays.some((day) => day.iso === selectedDate);
  const datePickerValue = isQuickDate ? null : dayjs(selectedDate);

  return (
    <Box data-testid="day-picker" sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
      {quickDays.map((day) => (
        <Button
          key={day.iso}
          data-testid="day-button"
          data-date={day.iso}
          data-selected={day.iso === selectedDate}
          variant={day.iso === selectedDate ? 'contained' : 'outlined'}
          onClick={() => onSelectDate(day.iso)}
        >
          {day.label}
        </Button>
      ))}
      <DatePicker
        value={datePickerValue}
        minDate={dayjs(todayIso)}
        onChange={(value: Dayjs | null) => {
          if (value && value.isValid()) {
            onSelectDate(value.format('YYYY-MM-DD'));
          }
        }}
        slotProps={{ textField: { 'data-testid': 'date-picker', size: 'small' } }}
      />
    </Box>
  );
}
