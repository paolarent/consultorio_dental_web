import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:3000/auth';
    private urlPasswRec = 'http://localhost:3000/usuario';
    
    private usuarioSubject = new BehaviorSubject<any>(null);
    usuario$ = this.usuarioSubject.asObservable();

    setUsuario(usuario: any) {
        this.usuarioSubject.next(usuario);
    }

    login(correo: string, contrasena: string) {
        return this.http.post(`${this.baseUrl}/login`, { correo, contrasena }, { withCredentials: true })
        .pipe(
            switchMap(() => this.getMe()), // ahora devuelve el usuario completo
            tap(usuario => {
                this.usuarioSubject.next(usuario);
            })
        );
    }


    logout(): Observable<any> {
        return this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true })
        .pipe(
            tap(() => this.usuarioSubject.next(null))
        );
    }


    getMe(): Observable<any> {
        return this.http.get(`${this.baseUrl}/me`, { withCredentials: true }).pipe(
            tap((usuario: any) => {
                // Guardamos info combinada directamente
                // paciente ya viene incluido en el response del backend
                this.usuarioSubject.next(usuario);
            })
        );
    }

    solicitarRecuperacion(correo: string) {
        return this.http.post(`${this.urlPasswRec}/recuperacion`, { correo }, { withCredentials: true });
    }


    restablecerContrasena(token: string, nuevaContrasena: string) {
        return this.http.patch(`${this.urlPasswRec}/restablecer`, { token, nuevaContrasena }, { withCredentials: true });
    }


}

