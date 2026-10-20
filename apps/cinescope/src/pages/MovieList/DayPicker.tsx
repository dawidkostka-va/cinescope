import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { getDayOptions } from '../../domain/dateUtils';
import { dataTestId } from '../../components/testId';

interface DayPickerProps {
  selectedIso: string;
  onSelect: (iso: string) => void;
}

export function DayPicker({ selectedIso, onSelect }: DayPickerProps) {
  const dayOptions = getDayOptions();

  return (
    <Box data-testid="day-picker" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      {dayOptions.map((day) => (
        <Button
          key={day.iso}
          data-testid="day-button"
          data-date={day.iso}
          data-selected={day.iso === selectedIso ? 'true' : 'false'}
          variant={day.iso === selectedIso ? 'contained' : 'outlined'}
          onClick={() => onSelect(day.iso)}
        >
          {day.label}
        </Button>
      ))}
      <DatePicker
        value={dayjs(selectedIso)}
        onChange={(value: Dayjs | null) => {
          if (value && value.isValid()) {
            onSelect(value.format('YYYY-MM-DD'));
          }
        }}
        minDate={dayjs(dayOptions[0].iso)}
        slotProps={{ textField: { size: 'small', slotProps: { htmlInput: dataTestId('date-picker') } } }}
      />
    </Box>
  );
}
