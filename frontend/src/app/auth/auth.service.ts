import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, tap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private http = inject(HttpClient);


    private baseUrl = 'http://localhost:3000/auth';
    private urlPasswRec = 'http://localhost:3000/usuario';

    // --- Estado reactivo del usuario usando Signals ---
    private _usuario = signal<any | null>(null);
    usuario = this._usuario.asReadonly();       // solo lectura desde fuera
    usuario$ = toObservable(this.usuario);      // observable para compatibilidad RxJS si lo necesitas


    login(correo: string, contrasena: string) {
        return this.http.post(`${this.baseUrl}/login`, { correo, contrasena }, { withCredentials: true })
        .pipe(
            // Tras el login, obtenemos el usuario completo
            switchMap(() => this.getMe())
        );
    }

    logout() {
        return this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true })
        .pipe(
            // Limpiamos el estado del usuario
            tap(() => this._usuario.set(null))
        );
    }

    getMe() {
        return this.http.get(`${this.baseUrl}/me`, { withCredentials: true })
        .pipe(
            tap((usuario: any) => this._usuario.set(usuario))
        );
    }

    solicitarRecuperacion(correo: string) {
        return this.http.post(`${this.urlPasswRec}/recuperacion`, { correo }, { withCredentials: true });
    }

    restablecerContrasena(token: string, nuevaContrasena: string) {
        return this.http.patch(`${this.urlPasswRec}/restablecer`, { token, nuevaContrasena }, { withCredentials: true });
    }

    setUsuario(usuario: any) {
        this._usuario.set(usuario);
    }
}
