import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    return next(req).pipe(
        catchError(err => {
            if ( err.status === 401 &&
            // Ignora 401 de /auth/me o de rutas de login
            !req.url.includes('/auth/me') &&
            !req.url.includes('/login')
            ) {
                authService.clearSession();
                router.navigate(['/login']);
            }

            return throwError(() => err);
        })
    );
};
