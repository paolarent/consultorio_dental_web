import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CondicionMedica } from '../models/get-condmed.model';

@Injectable({
    providedIn: 'root'
})
export class CondicionesMedicasService {
    private http = inject(HttpClient);
    private baseUrl = 'http://localhost:3000/condiciones-medicas'; //ruta backend

    listarCMPaciente(): Observable<CondicionMedica[]> {
        return this.http.get<CondicionMedica[]>(`${this.baseUrl}/mis-condiciones-medicas`, { withCredentials: true });
    }
}
