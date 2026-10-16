import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { addDays, todayIsoDate, weekdayName } from '../../lib/dates';

interface DayPickerProps {
  selectedDate: string;
  onSelect: (isoDate: string) => void;
}

function quickDays(): { isoDate: string; label: string }[] {
  const today = todayIsoDate();
  const days = [{ isoDate: today, label: 'Today' }];
  for (let i = 1; i <= 4; i++) {
    const isoDate = addDays(today, i);
    days.push({ isoDate, label: weekdayName(isoDate) });
  }
  return days;
}

export function DayPicker({ selectedDate, onSelect }: DayPickerProps) {
  const days = quickDays();

  return (
    <Stack
      data-testid="day-picker"
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', flexWrap: 'wrap' }}
    >
      {days.map((day) => {
        const selected = day.isoDate === selectedDate;
        return (
          <Button
            key={day.isoDate}
            data-testid="day-button"
            data-date={day.isoDate}
            data-selected={selected ? 'true' : 'false'}
            variant={selected ? 'contained' : 'outlined'}
            onClick={() => onSelect(day.isoDate)}
          >
            {day.label}
          </Button>
        );
      })}
      <DatePicker
        label="Choose a date"
        value={dayjs(selectedDate)}
        minDate={dayjs(todayIsoDate())}
        onChange={(value: Dayjs | null) => {
          if (value && value.isValid()) {
            onSelect(value.format('YYYY-MM-DD'));
          }
        }}
        slotProps={{
          textField: {
            'data-testid': 'date-picker',
            size: 'small',
          } as never,
        }}
      />
    </Stack>
  );
}
