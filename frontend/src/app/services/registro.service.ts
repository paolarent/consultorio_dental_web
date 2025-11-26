import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})

export class RegistroService {
    //private baseUrl = 'http://localhost:3000/registro';
    //private userBaseUrl = 'http://localhost:3000/usuario'
    private baseUrl = `${environment.backendUrl}/registro`;
    private userBaseUrl = `${environment.backendUrl}/usuario`;

    constructor(private http: HttpClient) {}

    registrarPacienteCompleto(data: any) {
        return this.http.post(`${this.baseUrl}/paciente-completo`, data, { withCredentials: true });
    }

    confirmRegistroContrasena(token: string, nuevaContrasena: string) {
        return this.http.patch(`${this.userBaseUrl}/confirmar-registro`, { token, nuevaContrasena }, { withCredentials: true });
    }

    logicalDeletePacUser(usuarioId: number, pacienteId: number) {
        return this.http.patch(`${this.baseUrl}/paciente-logical/${usuarioId}/${pacienteId}`, {}, { withCredentials: true });
    }


}