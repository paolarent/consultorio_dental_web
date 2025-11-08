import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UpdatePaciente } from '../models/update-paciente.model';

@Injectable({
    providedIn: 'root',
})
export class PacienteService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:3000/paciente/';

    updatePaciente(id: number, data: UpdatePaciente): Observable<any> {
        return this.http.patch(`${this.baseUrl}/${id}`, data, { withCredentials: true });
    }
}
