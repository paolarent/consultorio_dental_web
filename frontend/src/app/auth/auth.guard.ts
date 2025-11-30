import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    private auth = inject(AuthService);
    private router = inject(Router);

    canActivate(): Observable<boolean> {
        return this.auth.usuario$.pipe(
            switchMap(user => {
                if (user) return of(true);
                    return this.auth.getMe().pipe(
                        map(() => true),
                        catchError(() => of(false))
                    );
            }),
            
            tap(isLoggedIn => {
                if (!isLoggedIn) {
                    this.router.navigate(['/login'], { replaceUrl: true });
                }
            })
        );
    }
}
