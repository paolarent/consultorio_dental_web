import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente, UpdatePaciente } from '../models/paciente.model';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})

export class PacienteService {
    //private baseUrl = 'http://localhost:3000/paciente';
    private baseUrl = `${environment.backendUrl}/paciente`;

    constructor(private http: HttpClient) {}

    getPacienteById(id: number): Observable<Paciente> {
        return this.http.get<Paciente>(`${this.baseUrl}/${id}`, { withCredentials: true });
    }

    updatePaciente(id_paciente: number, data: UpdatePaciente) {
        return this.http.patch<Paciente>(`${this.baseUrl}/${id_paciente}`, data);
    }


    buscarPacientes(q: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/buscar?q=${q}`, { withCredentials: true });
    }

    getPacientesActivosConsultorio(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/consultorio/activos`, { withCredentials: true });
    }

}
