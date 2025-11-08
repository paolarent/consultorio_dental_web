import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CondicionMedica {
    id_condicion_medica: number;
    nombre: string;
    a_o_diagnostico: string; 
    medicamentos_actuales: string;
    condicion_controlada: 'si' | 'no';
    medicamentos_formateados?: string;
}

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
