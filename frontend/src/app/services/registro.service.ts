import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root',
})

export class RegistroService {
    private baseUrl = 'http://localhost:3000/registro';
    private userBaseUrl = 'http://localhost:3000/usuario'

    constructor(private http: HttpClient) {}

    registrarPacienteCompleto(data: any) {
        return this.http.post(`${this.baseUrl}/paciente-completo`, data, { withCredentials: true });
    }

    confirmRegistroContrasena(token: string, nuevaContrasena: string) {
        return this.http.patch(`${this.userBaseUrl}/confirmar-registro`, { token, nuevaContrasena }, { withCredentials: true });
    }

}