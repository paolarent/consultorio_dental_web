import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root',
})

export class RegistroServiceService {
    private baseUrl = 'http://localhost:3000/registro';

    constructor(private http: HttpClient) {}

    registrarPacienteCompleto(data: any) {
        return this.http.post(`${this.baseUrl}/paciente-completo`, data, { withCredentials: true });
    }

}