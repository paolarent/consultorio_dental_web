import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { appRouterProviders } from './app/app.routes';
import { authInterceptor } from './app/interceptors/auth.interceptor';

bootstrapApplication(App, {
  ...appConfig,
  ...appRouterProviders,
  providers: [
    ...(appConfig.providers || []),
    importProvidersFrom(HttpClientModule),
    provideHttpClient(withInterceptors([authInterceptor])),
  ]
})
.catch((err) => console.error(err));
