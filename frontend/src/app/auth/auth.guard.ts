import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, map, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    private auth = inject(AuthService);
    private router = inject(Router);

    canActivate(): Observable<boolean> {
        return this.auth.usuario$.pipe(
            map(user => !!user), // transforma el usuario en true/false
            tap(isLoggedIn => {
                if (!isLoggedIn) {
                this.router.navigate(['/login'], { replaceUrl: true });
                }
            })
        );
    }
}
