import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { appRouterProviders } from './app/app.routes';

bootstrapApplication(App, {
  ...appConfig,
  ...appRouterProviders,
  providers: [
    ...(appConfig.providers || []),
    importProvidersFrom(HttpClientModule),
  ]
})
.catch((err) => console.error(err));
