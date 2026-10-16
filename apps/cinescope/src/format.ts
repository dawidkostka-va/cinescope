import dayjs from 'dayjs';

export function formatShowDate(date: string, time: string): string {
  return dayjs(`${date}T${time}`).format('dddd D MMM HH:mm');
}

export function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} PLN`;
}
