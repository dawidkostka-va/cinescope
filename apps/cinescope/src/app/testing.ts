import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

export const testProviders = () => [
  provideRouter(appRoutes),
  provideHttpClient(),
  provideHttpClientTesting(),
  provideNativeDateAdapter(),
];
