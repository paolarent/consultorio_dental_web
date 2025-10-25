import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideToastr({
      timeOut: 3000, // 3 segundos
      positionClass: 'toast-top-right',
      closeButton: true, // Botón de cerrar
      preventDuplicates: true,
      tapToDismiss: true,
      newestOnTop: true
    }),
    provideAnimations()
  ]
};
