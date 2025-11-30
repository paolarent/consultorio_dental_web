import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    return next(req).pipe(
        catchError(err => {
            if (
                err.status === 401 &&
                !req.url.includes('/auth/me') &&
                !req.url.includes('/login')
            ) {
                // Intentar refresh
                
                return authService.refresh().pipe(
                    switchMap(res => {
                        
                        if (res === null) {
                            // refresh falló
                            console.log('Refresh token inválido o expirado');
                            authService.clearSession();
                            router.navigate(['/login']);
                            return throwError(() => err);
                        }
                        //Actualizamos el Signal antes de reintentar la request
                        return authService.getMe().pipe(
                            switchMap(usuario => {
                                //console.log('Usuario actualizado después del refresh:', usuario);

                                // Reintenta la petición original con credenciales actualizadas
                                return next(req.clone({ withCredentials: true }));
                            }),
                            catchError(() => {
                                console.log('Error al obtener usuario después del refresh');
                                authService.clearSession();
                                router.navigate(['/login']);
                                return throwError(() => err);
                            })
                        );
                    }),
                    catchError(() => {
                        console.log('Error durante refresh:');
                        // cualquier error durante refresh
                        authService.clearSession();
                        router.navigate(['/login']);
                        return throwError(() => err);
                    })
                );
            }

            return throwError(() => err);
        })
    );
};
