import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import { inject } from '@vercel/analytics';
import { App } from './app/app';

bootstrapApplication(App)
  .then(() => inject({ mode: isDevMode() ? 'development' : 'production' }))
  .catch(console.error);
