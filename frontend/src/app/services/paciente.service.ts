import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdatePaciente } from '../models/update-paciente.model';

@Injectable({
    providedIn: 'root',
})

export class PacienteService {
    private baseUrl = 'http://localhost:3000/paciente';

    constructor(private http: HttpClient) {}

    getPacienteById(id: number): Observable<UpdatePaciente> {
        return this.http.get<UpdatePaciente>(`${this.baseUrl}/${id}`, { withCredentials: true });
    }

    updatePaciente(id: number, data: UpdatePaciente): Observable<UpdatePaciente> {
        return this.http.patch<UpdatePaciente>(`${this.baseUrl}/${id}`, data, { withCredentials: true });
    }

    buscarPacientes(q: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/buscar?q=${q}`, { withCredentials: true });
    }

    getPacientesActivosConsultorio(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/consultorio/activos`, { withCredentials: true });
    }

}
