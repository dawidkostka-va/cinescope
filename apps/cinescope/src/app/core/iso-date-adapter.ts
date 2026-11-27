import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { parseIso, toIso } from './dates';

@Injectable()
export class IsoDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat?: unknown): Date | null {
    return (typeof value === 'string' && parseIso(value.trim())) || super.parse(value, parseFormat);
  }

  override format(date: Date, displayFormat: unknown): string {
    return displayFormat === 'iso' ? toIso(date) : super.format(date, displayFormat as object);
  }
}
