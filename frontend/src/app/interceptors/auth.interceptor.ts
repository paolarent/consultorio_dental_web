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
        if (err.status === 401) {
            // Si el token/cookie expiró
            authService.logout().subscribe(() => {
            router.navigate(['/login']);
            });
        }
        return throwError(() => err);
        })
    );
};
