import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);

    private baseUrl = 'http://localhost:3000/auth';
    private urlPasswRec = 'http://localhost:3000/usuario';

    // --- Estado reactivo del usuario usando Signals ---
    private _usuario = signal<any | null>(null);
    usuario = this._usuario.asReadonly();       // solo lectura desde fuera
    usuario$ = toObservable(this.usuario);      // observable para compatibilidad RxJS

    // --- Login ---
    login(correo: string, contrasena: string) {
        return this.http.post(`${this.baseUrl}/login`, { correo, contrasena }, { withCredentials: true }).pipe(
            tap((res: any) => this._usuario.set(res.usuario)), // Set usuario inmediatamente
            switchMap(() => this.getMe().pipe(catchError(() => of(null)))) // Refresca datos desde backend
        );
    }

    logout() {
        return this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true })
        .pipe(
            // Limpiamos el estado del usuario
            tap(() => this.clearSession())
        );
    }

    clearSession() {
        this._usuario.set(null);
    }

    getMe() {
        return this.http.get(`${this.baseUrl}/me`, { withCredentials: true })
        .pipe(
            tap((usuario: any) => this._usuario.set(usuario))
        );
    }

    /*initAuthCheck(currentPath: string) {
        const publicRoutes = ['/login', '/login/paciente', '/login/forgot-password', '/login/restore-password'];
        if (publicRoutes.includes(currentPath)) return;

        this.getMe().subscribe({
            next: () => {},
            error: () => this._usuario.set(null)
        });
    }*/

    solicitarRecuperacion(correo: string) {
        return this.http.post(`${this.urlPasswRec}/recuperacion`, { correo }, { withCredentials: true });
    }

    restablecerContrasena(token: string, nuevaContrasena: string) {
        return this.http.patch(`${this.urlPasswRec}/restablecer`, { token, nuevaContrasena }, { withCredentials: true });
    }

    setUsuario(usuario: any) {
        this._usuario.set(usuario);
    }

    refresh() {
        return this.http.post(`${this.baseUrl}/refresh`, {}, { withCredentials: true }).pipe(
            catchError(() => {
            this.clearSession();
            return of(null);
            })
        );
    }

}
